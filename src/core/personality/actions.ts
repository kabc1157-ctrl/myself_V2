"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createSupabaseAdminClient } from "@/core/supabase/admin";
import { PERSONALITY_ASSESSMENT_VERSION } from "@/core/personality/questions";
import { createPersonalityReport } from "@/core/personality/report";
import { isPersonalityReportSnapshot } from "@/core/personality/snapshot";

export type CompletePersonalityResult = { ok: boolean; error?: string };

/**
 * Only authenticated users can complete their own saved, in-progress draft.
 * Never accept client scores, interpretation text, or a user ID.
 *
 * The admin client is server-only. An atomic UPDATE on personality_assessments
 * writes the immutable snapshot, and the AFTER UPDATE trigger changes the
 * profile to completed in the same Postgres transaction.
 */
export async function completePersonalityAssessment(
  answers: unknown,
): Promise<CompletePersonalityResult> {
  let snapshot: ReturnType<typeof createPersonalityReport>;
  try {
    snapshot = createPersonalityReport(answers);
  } catch {
    return { ok: false, error: "35개 문항에 모두 올바르게 응답해 주세요." };
  }

  // Account completion is irreversible. Do not commit a result the reader cannot render.
  if (!isPersonalityReportSnapshot(snapshot.report)) {
    return { ok: false, error: "결과 형식을 확인하지 못했어요. 완료 처리하지 않았으니 다시 시도해 주세요." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, error: "로그인이 필요합니다." };

    const { data: assessment, error: readError } = await supabase
      .from("personality_assessments")
      .select("id,status,version")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) return { ok: false, error: "검사 상태를 확인하지 못했어요." };
    if (!assessment) {
      return { ok: false, error: "임시 저장된 검사가 없어요. 답변을 저장한 뒤 다시 시도해 주세요." };
    }
    if (assessment.status !== "in_progress") {
      return { ok: false, error: "이미 완료한 검사는 다시 제출할 수 없어요." };
    }
    if (assessment.version !== PERSONALITY_ASSESSMENT_VERSION) {
      return { ok: false, error: "검사 문항 버전이 달라 결과를 저장할 수 없어요." };
    }

    const now = new Date().toISOString();
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("personality_assessments")
      .update({
        answers_json: answers,
        scores_json: snapshot.scores,
        interpretation_version: snapshot.report.interpretationVersion,
        report_json: snapshot.report,
        status: "completed",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", assessment.id)
      .eq("user_id", user.id)
      .eq("version", PERSONALITY_ASSESSMENT_VERSION)
      .eq("status", "in_progress")
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: "결과 저장에 실패했어요. 중복 제출 여부를 확인하고 다시 시도해 주세요." };
    }
    revalidatePath("/mypage");
    revalidatePath("/mypage/personality");
    revalidatePath("/mypage/personality/report");
    revalidatePath("/onboarding");
    return { ok: true };
  } catch {
    return { ok: false, error: "검사 결과를 저장할 수 없어요. 잠시 후 다시 시도해 주세요." };
  }
}
