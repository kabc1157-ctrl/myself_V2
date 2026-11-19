"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { PERSONALITY_ASSESSMENT_VERSION } from "@/core/personality/questions";
import { validateAssessmentAnswers } from "@/core/personality/scoring";

const MODULES = ["diary", "routine", "schedule", "exercise", "reading", "memo", "payroll", "investment", "goal", "project"] as const;
type Result = { ok: boolean; error?: string };

async function clientAndUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("로그인이 필요합니다.");
  return { supabase, user };
}

export async function saveProfile(input: { nickname: string; timezone: string }): Promise<Result> {
  try {
    const { supabase, user } = await clientAndUser();
    const { error } = await supabase.from("profiles").update({ nickname: input.nickname.trim(), timezone: input.timezone || "Asia/Seoul", onboarding_step: "assessment" }).eq("user_id", user.id);
    if (error) return { ok: false, error: "프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
    revalidatePath("/onboarding");
    return { ok: true };
  } catch { return { ok: false, error: "로그인 세션을 확인해 주세요." }; }
}

export async function saveAssessmentDraft(answers: Record<string, string>): Promise<Result> {
  try {
    const { supabase, user } = await clientAndUser();
    // Drafts may be incomplete, but question IDs and 1–5 answers are strict.
    // Never accept scores/reports from the client; completion remains disabled.
    try {
      validateAssessmentAnswers(answers, { allowPartial: true });
    } catch {
      return { ok: false, error: "검사 답변 형식이 올바르지 않아요." };
    }

    const { data: existing, error: readError } = await supabase
      .from("personality_assessments")
      .select("id,status,version")
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) return { ok: false, error: "검사 상태를 확인하지 못했어요." };
    if (existing && existing.status !== "in_progress") {
      return { ok: false, error: "완료한 검사는 다시 수정할 수 없어요." };
    }
    if (existing && existing.version !== PERSONALITY_ASSESSMENT_VERSION) {
      return { ok: false, error: "이전 검사 문항으로 작성한 임시 답변은 자동 변경할 수 없어요. 관리자에게 문의해 주세요." };
    }

    const payload = { answers_json: answers, updated_at: new Date().toISOString() };
    const { error } = existing
      ? await supabase.from("personality_assessments")
          .update(payload).eq("id", existing.id).eq("user_id", user.id).eq("status", "in_progress")
      : await supabase.from("personality_assessments")
          .insert({ ...payload, user_id: user.id, version: PERSONALITY_ASSESSMENT_VERSION, status: "in_progress" });
    if (error) return { ok: false, error: "검사 진행 상태를 저장하지 못했어요." };

    const { error: profileError } = await supabase.from("profiles")
      .update({ assessment_status: "in_progress", updated_at: new Date().toISOString() })
      .eq("user_id", user.id).neq("assessment_status", "completed");
    if (profileError) return { ok: false, error: "검사 상태를 저장하지 못했어요." };
    return { ok: true };
  } catch { return { ok: false, error: "로그인 세션을 확인해 주세요." }; }
}

export async function skipAssessmentForDevelopment(): Promise<Result> {
  try {
    const { supabase, user } = await clientAndUser();
    const { data: assessment, error: readError } = await supabase
      .from("personality_assessments").select("status").eq("user_id", user.id).maybeSingle();
    if (readError) return { ok: false, error: "검사 상태를 확인하지 못했어요." };
    if (assessment && assessment.status !== "in_progress") {
      return { ok: false, error: "완료된 검사는 건너뛸 수 없어요." };
    }
    const { data, error } = await supabase.from("profiles")
      .update({ assessment_status: "skipped", onboarding_step: "modules", updated_at: new Date().toISOString() })
      .eq("user_id", user.id).neq("assessment_status", "completed")
      .select("user_id").maybeSingle();
    return error || !data
      ? { ok: false, error: "성향 검사 건너뛰기를 저장하지 못했어요." }
      : { ok: true };
  } catch { return { ok: false, error: "로그인 세션을 확인해 주세요." }; }
}

export async function saveModules(selected: string[]): Promise<Result> {
  try {
    const { supabase, user } = await clientAndUser();
    const rows = MODULES.map((module_key) => ({ user_id: user.id, module_key, enabled: module_key === "diary" || module_key === "routine" || selected.includes(module_key), ai_enabled: false }));
    const { error } = await supabase.from("module_preferences").upsert(rows, { onConflict: "user_id,module_key" });
    if (error) return { ok: false, error: "사용 모듈을 저장하지 못했어요." };
    const { error: profileError } = await supabase.from("profiles").update({ onboarding_step: "consents" }).eq("user_id", user.id);
    if (profileError) return { ok: false, error: "온보딩 진행 상태를 저장하지 못했어요." };
    return { ok: true };
  } catch { return { ok: false, error: "로그인 세션을 확인해 주세요." }; }
}

export async function saveConsents(consents: Record<string, boolean>): Promise<Result> {
  try {
    const { supabase, user } = await clientAndUser();
    const rows = Object.entries(consents).map(([consent_key, consented]) => ({ user_id: user.id, consent_key, consented, version: "v1" }));
    const { error } = await supabase.from("ai_consents").upsert(rows, { onConflict: "user_id,consent_key" });
    if (error) return { ok: false, error: "AI 동의 설정을 저장하지 못했어요." };
    for (const [key, consented] of Object.entries(consents)) {
      if (!key.startsWith("module:")) continue;
      const moduleKey = key.slice("module:".length);
      const { error: moduleError } = await supabase.from("module_preferences").update({ ai_enabled: consented }).eq("user_id", user.id).eq("module_key", moduleKey);
      if (moduleError) return { ok: false, error: "모듈별 AI 동의 설정을 저장하지 못했어요." };
    }
    const { error: profileError } = await supabase.from("profiles").update({ onboarding_step: "result" }).eq("user_id", user.id);
    if (profileError) return { ok: false, error: "온보딩 진행 상태를 저장하지 못했어요." };
    return { ok: true };
  } catch { return { ok: false, error: "로그인 세션을 확인해 주세요." }; }
}
