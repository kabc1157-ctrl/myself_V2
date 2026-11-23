import { describe, expect, it } from "vitest";
import { ASSESSMENT_ITEMS, PERSONALITY_DIMENSIONS, type PersonalityDimension } from "./questions";
import { calculatePersonalityScores } from "./scoring";
import { createPersonalityReport } from "./report";
import { createPersonalityReportV2, deriveStoredPersonalityReportV2 } from "./report-v2";
import { isPersonalityReportSnapshot } from "./snapshot";
import { isPersonalityReportV2 } from "./snapshot-v2";

function answers(levels: Partial<Record<PersonalityDimension, number>> = {}) {
  return Object.fromEntries(ASSESSMENT_ITEMS.map(item => {
    const adjusted = levels[item.dimension] ?? 3;
    return [item.id, String(item.reverseScored ? 6 - adjusted : adjusted)];
  }));
}

describe("personality report v2", () => {
  it("keeps the 35 questions, ten dimensions and scoring unchanged", () => {
    expect(ASSESSMENT_ITEMS).toHaveLength(35);
    expect(PERSONALITY_DIMENSIONS).toHaveLength(10);
    const input = answers({cue_centered: 5, flexible_execution: 5});
    expect(createPersonalityReportV2(input).scores).toEqual(calculatePersonalityScores(input));
  });

  it("renders an old completed snapshot as v2 without changing the old snapshot", () => {
    const input = answers({cue_centered: 5, flexible_execution: 5});
    const original = createPersonalityReport(input);
    const before = JSON.stringify(original);
    expect(isPersonalityReportSnapshot(original.report)).toBe(true);
    const upgraded = deriveStoredPersonalityReportV2(input, JSON.parse(JSON.stringify(original.scores)));
    expect(isPersonalityReportV2(upgraded)).toBe(true);
    expect(upgraded.reportVersion).toBe("ieumsae-personality-report-v2");
    expect(upgraded.headline).toContain("시작 계기");
    expect(upgraded.sections.summary.strategy).toContain("유연하게");
    expect(JSON.stringify(original)).toBe(before);
  });

  it("rejects missing or altered old answers and scores", () => {
    const input = answers();
    const scores = calculatePersonalityScores(input);
    expect(() => deriveStoredPersonalityReportV2({}, scores)).toThrow();
    expect(() => deriveStoredPersonalityReportV2(input, {...scores, dimensions: {...scores.dimensions,
      openness: {...scores.dimensions.openness, score: 99}}})).toThrow();
  });

  it("generates distinct deterministic reports for high, low and mixed patterns", () => {
    const high = createPersonalityReportV2(answers({cue_centered: 5, flexible_execution: 5}));
    const low = createPersonalityReportV2(answers({cue_centered: 1, flexible_execution: 1}));
    const mixed = createPersonalityReportV2(answers());
    expect(isPersonalityReportV2(high.report)).toBe(true);
    expect(isPersonalityReportV2(low.report)).toBe(true);
    expect(isPersonalityReportV2(mixed.report)).toBe(true);
    expect(high.report.headline).not.toBe(low.report.headline);
    expect(high.report.sections.strategies.items[0].action).not.toBe(low.report.sections.strategies.items[0].action);
    expect(createPersonalityReportV2(answers({cue_centered: 5, flexible_execution: 5}))).toEqual(high);
    expect(mixed.report.sections.connections.note.length).toBeGreaterThan(10);
  });

  it("never mistakes low emotional sensitivity for resilience", () => {
    const report = createPersonalityReportV2(answers({emotional_sensitivity: 1})).report;
    expect(JSON.stringify(report)).not.toContain("회복탄력성");
    expect(report.disclaimer).toContain("백분위");
  });
});
