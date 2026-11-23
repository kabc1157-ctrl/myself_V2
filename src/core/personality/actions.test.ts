import { beforeEach, describe, expect, it, vi } from "vitest";
import { ASSESSMENT_ITEMS, PERSONALITY_ASSESSMENT_VERSION } from "./questions";
import { completePersonalityAssessment } from "./actions";
import { createPersonalityReportV2 } from "./report-v2";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  write: vi.fn(),
  revalidate: vi.fn(),
  snapshotValid: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/core/personality/snapshot-v2", () => ({ isPersonalityReportV2: mocks.snapshotValid }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: () => {
      const builder = { select: () => builder, eq: () => builder, maybeSingle: mocks.read };
      return builder;
    },
  }),
}));
vi.mock("@/core/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => {
      const builder = {
        update: (payload: unknown) => { mocks.update(payload); return builder; },
        eq: () => builder,
        select: () => builder,
        maybeSingle: mocks.write,
      };
      return builder;
    },
  }),
}));

const answers = Object.fromEntries(ASSESSMENT_ITEMS.map(item => [item.id, "3"]));

describe("completePersonalityAssessment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.read.mockResolvedValue({ data: { id: "assessment-1", status: "in_progress", version: PERSONALITY_ASSESSMENT_VERSION }, error: null });
    mocks.write.mockResolvedValue({ data: { id: "assessment-1" }, error: null });
    mocks.snapshotValid.mockReturnValue(true);
  });

  it("saves server-derived scores and report together in the completion write", async () => {
    const expected = createPersonalityReportV2(answers);
    expect(await completePersonalityAssessment(answers)).toEqual({ ok: true });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      answers_json: answers,
      status: "completed",
      scores_json: expected.scores,
      report_json: expected.report,
      interpretation_version: expected.report.interpretationVersion,
      completed_at: expect.any(String),
    }));
  });

  it("does not finalize if the stored-report reader would reject the result", async () => {
    mocks.snapshotValid.mockReturnValue(false);
    expect((await completePersonalityAssessment(answers)).ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects incomplete or manipulated answers without writing", async () => {
    expect((await completePersonalityAssessment({})).ok).toBe(false);
    expect((await completePersonalityAssessment({ ...answers, fake: "5" })).ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a completed account without writing a second result", async () => {
    mocks.read.mockResolvedValue({ data: { id: "assessment-1", status: "completed", version: PERSONALITY_ASSESSMENT_VERSION }, error: null });
    expect((await completePersonalityAssessment(answers)).ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated users without writing", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await completePersonalityAssessment(answers)).ok).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("does not report success if a competing completion prevents the conditional write", async () => {
    mocks.write.mockResolvedValue({ data: null, error: null });
    expect((await completePersonalityAssessment(answers)).ok).toBe(false);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
