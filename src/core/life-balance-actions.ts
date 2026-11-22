"use server";

import { createSupabaseServerClient } from "@/core/supabase/server";
import {
  emptyLifeBalance, lifeBalanceStartDate, summarizeLifeBalance,
  type LifeBalancePeriod, type LifeBalanceCounts, type LifeBalanceSources,
} from "@/core/life-balance";

export type LifeBalanceResponse = { ok: true; counts: LifeBalanceCounts } | { ok: false; counts: LifeBalanceCounts; error: string };
const validPeriod = (period: string): period is LifeBalancePeriod => ["all", "1y", "6m", "1m", "7d"].includes(period);

export async function getLifeBalancePeriod(period: LifeBalancePeriod): Promise<LifeBalanceResponse> {
  if (!validPeriod(period)) return { ok: false, counts: emptyLifeBalance(), error: "기간을 확인해 주세요." };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, counts: emptyLifeBalance(), error: "로그인이 필요합니다." };
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("user_id", user.id).maybeSingle();
  const timeZone = profile?.timezone || "Asia/Seoul";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  const start = lifeBalanceStartDate(period, today);
  // Timestamp filtering begins one UTC day before the local start to respect time-zone boundaries.
  const earliest = start ? new Date(new Date(start + "T00:00:00Z").getTime() - 86_400_000).toISOString() : null;
  let todoQuery = supabase.from("todos").select("id,project_id,life_area,is_completed,completed_at").eq("user_id", user.id).eq("is_completed", true).not("completed_at", "is", null);
  let occurrenceQuery = supabase.from("routine_occurrences").select("routine_id,occurrence_date,status").eq("user_id", user.id).eq("status", "completed");
  let exerciseQuery = supabase.from("exercise_records").select("id,exercise_date").eq("user_id", user.id).is("deleted_at", null);
  let calendarQuery = supabase.from("calendar_event_life_areas").select("event_id,event_date,life_area").eq("user_id", user.id);
  let completionQuery = supabase.from("schedule_completions").select("source_type,source_id,completion_date").eq("user_id", user.id).eq("source_type", "google");
  if (earliest) todoQuery = todoQuery.gte("completed_at", earliest);
  if (start) {
    occurrenceQuery = occurrenceQuery.gte("occurrence_date", start);
    exerciseQuery = exerciseQuery.gte("exercise_date", start);
    calendarQuery = calendarQuery.gte("event_date", start);
    completionQuery = completionQuery.gte("completion_date", start);
  }
  const results = await Promise.all([
    supabase.from("projects").select("id,classification").eq("user_id", user.id),
    todoQuery,
    supabase.from("routine_definitions").select("id,life_area").eq("user_id", user.id).is("deleted_at", null),
    occurrenceQuery, exerciseQuery, calendarQuery, completionQuery,
  ]);
  if (results.some((result) => result.error)) {
    console.error("[life-balance] query failed", results.filter((result) => result.error).map((result) => result.error?.code));
    return { ok: false, counts: emptyLifeBalance(), error: "삶 밸런스 기록을 불러오지 못했어요." };
  }
  const data = results.map((result) => result.data ?? []);
  const sources = {
    projects: data[0], todos: data[1], routines: data[2], occurrences: data[3],
    exercises: data[4], calendarAreas: data[5], completions: data[6],
  } as LifeBalanceSources;
  return { ok: true, counts: summarizeLifeBalance(sources, period, today, timeZone) };
}
