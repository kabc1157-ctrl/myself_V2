"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "./supabase/server";

export async function saveDailyInsightAnswer(insightId: string, answer: string) {
  if (!insightId || !answer.trim()) return { ok: false, error: "답변을 입력해 주세요." };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const { error } = await supabase.from("daily_insight_answers").upsert({ user_id: user.id, insight_id: insightId, answer, updated_at: new Date().toISOString() }, { onConflict: "user_id,insight_id" });
  if (error) return { ok: false, error: "답변을 저장하지 못했어요." };
  revalidatePath("/me/today");
  return { ok: true };
}

export async function markDailyInsightRead(insightId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !insightId) return { ok: false };
  await supabase.from("daily_integrated_insights").update({ is_read: true, updated_at: new Date().toISOString() }).eq("id", insightId).eq("user_id", user.id);
  await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("insight_id", insightId).eq("user_id", user.id);
  return { ok: true };
}

export async function requestDailyInsight(date: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const { data: consents } = await supabase.from("ai_consents").select("consent_key,consented").eq("user_id", user.id).eq("consented", true);
  const allowed = new Set((consents ?? []).map((item) => item.consent_key));
  const sources = [] as { key: string; count: number }[];
  if (allowed.has("module:diary")) { const { count } = await supabase.from("diary_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("entry_date", date).is("deleted_at", null); sources.push({ key: "diary", count: count ?? 0 }); }
  if (allowed.has("module:routine")) { const { count } = await supabase.from("routine_occurrences").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("occurrence_date", date); const { count: reflections } = await supabase.from("routine_reflections").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("reflection_date", date).is("deleted_at", null); sources.push({ key: "routine", count: (count ?? 0) + (reflections ?? 0) }); }
  if (allowed.has("module:schedule")) { const { count } = await supabase.from("todos").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("planned_date", date); sources.push({ key: "schedule", count: count ?? 0 }); }
  if (allowed.has("module:project")) { const { count } = await supabase.from("project_reflections").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", `${date}T00:00:00+09:00`).lt("created_at", `${date}T24:00:00+09:00`); sources.push({ key: "project", count: count ?? 0 }); }
  if (allowed.has("module:memo")) { const { count } = await supabase.from("memos").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("updated_at", `${date}T00:00:00+09:00`).lt("updated_at", `${date}T24:00:00+09:00`).is("deleted_at", null); sources.push({ key: "memo", count: count ?? 0 }); }
  if (!sources.some((source) => source.count > 0)) {
    await supabase.from("daily_integrated_insights").upsert({ user_id: user.id, insight_date: date, status: "no_data", source_snapshot: sources, consent_snapshot: Object.fromEntries([...allowed].map((key) => [key, true])), updated_at: new Date().toISOString() }, { onConflict: "user_id,insight_date" });
    revalidatePath("/me/today");
    return { ok: true, status: "no_data" as const };
  }
  return { ok: false, error: "AI 분석 제공자 설정이 필요해요. 기록은 외부로 전송하지 않았어요." };
}
