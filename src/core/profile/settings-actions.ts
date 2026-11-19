"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/core/supabase/server";

const MODULES = ["memo", "exercise", "reading", "payroll", "investment", "schedule"] as const;
const DEFAULT_ORDER = [...MODULES];
type Result = { ok: boolean; error?: string };
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

async function context() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

export async function updateMyPageSettings(input: {
  nickname: string;
  weekStartsOn: "monday" | "sunday";
  aiFeedbackStyle: "empathetic" | "problem_solving";
  dayStartsAt: string;
  dayEndsAt: string;
}): Promise<Result> {
  const ctx = await context();
  if (!ctx) return { ok: false, error: "로그인이 필요합니다." };
  if (input.nickname.trim().length > 80) return { ok: false, error: "닉네임은 80자 이내로 입력해 주세요." };
  if (!TIME_RE.test(input.dayStartsAt) || !TIME_RE.test(input.dayEndsAt)) return { ok: false, error: "시간은 HH:mm 형식으로 입력해 주세요." };
  const values = { nickname: input.nickname.trim(), week_starts_on: input.weekStartsOn, ai_feedback_style: input.aiFeedbackStyle, day_starts_at: `${input.dayStartsAt}:00`, day_ends_at: `${input.dayEndsAt}:00`, updated_at: new Date().toISOString() };
  let { data, error } = await ctx.supabase.from("profiles").update(values).eq("user_id", ctx.user.id).select("user_id,nickname,week_starts_on,ai_feedback_style,day_starts_at,day_ends_at").maybeSingle();
  if (error) return { ok: false, error: `설정을 저장하지 못했어요. (${error.code ?? "DB_ERROR"})` };
  if (!data) {
    const inserted = await ctx.supabase.from("profiles").insert({ user_id: ctx.user.id, ...values }).select("user_id,nickname,week_starts_on,ai_feedback_style,day_starts_at,day_ends_at").maybeSingle();
    data = inserted.data;
    error = inserted.error;
    if (error) return { ok: false, error: `사용자 설정 프로필을 생성하지 못했어요. (${error.code ?? "DB_ERROR"})` };
  }
  if (!data) return { ok: false, error: "사용자 설정을 저장하지 못했어요." };
  const stored = { nickname: data.nickname ?? "", weekStartsOn: data.week_starts_on, aiFeedbackStyle: data.ai_feedback_style, dayStartsAt: String(data.day_starts_at).slice(0, 5), dayEndsAt: String(data.day_ends_at).slice(0, 5) };
  if (stored.nickname !== values.nickname || stored.weekStartsOn !== values.week_starts_on || stored.aiFeedbackStyle !== values.ai_feedback_style || stored.dayStartsAt !== input.dayStartsAt || stored.dayEndsAt !== input.dayEndsAt) return { ok: false, error: "저장된 설정을 다시 확인하지 못했어요." };
  revalidatePath("/mypage"); revalidatePath("/home"); revalidatePath("/diary"); revalidatePath("/routine"); revalidatePath("/schedule");
  return { ok: true };
}

export async function updateModulePreferences(values: Record<string, boolean>): Promise<Result> {
  const ctx = await context();
  if (!ctx) return { ok: false, error: "로그인이 필요합니다." };
  const rows = MODULES.map((module_key) => ({ user_id: ctx.user.id, module_key, enabled: values[module_key] === true, ai_enabled: false }));
  const { error } = await ctx.supabase.from("module_preferences").upsert(rows, { onConflict: "user_id,module_key" });
  if (error) return { ok: false, error: `활성 모듈을 저장하지 못했어요. (${error.code ?? "DB_ERROR"})` };
  revalidatePath("/mypage"); revalidatePath("/home"); return { ok: true };
}

export async function updateNavigationOrder(order: string[]): Promise<Result> {
  const ctx = await context();
  if (!ctx) return { ok: false, error: "로그인이 필요합니다." };
  const safe = [...new Set(order)].filter((key) => MODULES.includes(key as typeof MODULES[number]));
  const { error } = await ctx.supabase.from("navigation_preferences").upsert({ user_id: ctx.user.id, module_order: safe.length ? safe : DEFAULT_ORDER, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: `메뉴 순서를 저장하지 못했어요. (${error.code ?? "DB_ERROR"})` };
  revalidatePath("/mypage"); return { ok: true };
}

const AI_CONSENT_KEYS = ["module:diary", "module:routine", "module:schedule", "module:exercise", "module:reading", "module:memo", "module:payroll", "module:investment", "module:goal", "module:project", "personality_analysis"] as const;

export async function updateAiConsents(consents: Record<string, boolean>): Promise<Result> {
  const ctx = await context();
  if (!ctx) return { ok: false, error: "로그인이 필요합니다." };
  const now = new Date().toISOString();
  const rows = AI_CONSENT_KEYS.map((consent_key) => ({ user_id: ctx.user.id, consent_key, consented: consents[consent_key] === true, version: "v1", updated_at: now }));
  const { error } = await ctx.supabase.from("ai_consents").upsert(rows, { onConflict: "user_id,consent_key" });
  if (error) return { ok: false, error: "AI 분석 동의를 저장하지 못했어요." };
  for (const row of rows.filter((item) => item.consent_key.startsWith("module:"))) {
    const { error: moduleError } = await ctx.supabase.from("module_preferences").update({ ai_enabled: row.consented, updated_at: now }).eq("user_id", ctx.user.id).eq("module_key", row.consent_key.slice("module:".length));
    if (moduleError) return { ok: false, error: "모듈별 AI 동의를 저장하지 못했어요." };
  }
  const { data: stored, error: verifyError } = await ctx.supabase.from("ai_consents").select("consent_key,consented").eq("user_id", ctx.user.id).in("consent_key", [...AI_CONSENT_KEYS]);
  const storedMap = new Map((stored ?? []).map((item) => [item.consent_key, item.consented]));
  if (verifyError || rows.some((row) => storedMap.get(row.consent_key) !== row.consented)) return { ok: false, error: "저장된 AI 동의를 다시 확인하지 못했어요." };
  revalidatePath("/mypage"); revalidatePath("/home"); revalidatePath("/me/today");
  return { ok: true };
}

export async function getAiConsents(): Promise<Record<string, boolean>> {
  const ctx = await context();
  if (!ctx) return {};
  const { data } = await ctx.supabase.from("ai_consents").select("consent_key,consented").eq("user_id", ctx.user.id);
  return Object.fromEntries((data ?? []).map((item) => [item.consent_key, item.consented]));
}
