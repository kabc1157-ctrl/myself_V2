import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/app-shell";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { TodayClient } from "./today-client";
type HistoryRow = { id: string; insight_date: string; status: string; summary: string | null; strengths: string[]; clues: string[]; adjustments: string[]; next_action: string | null; question: string | null; is_read: boolean; created_at: string; daily_insight_answers?: Array<{ answer: string }> };
function validDate(value?: string) { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date()); }
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ date?: string; tab?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/me/today");
  const params = await searchParams;
  const date = validDate(params.date);
  const tab = params.tab === "unfinished" ? "unfinished" : "today";
  const [{ data: insight }, { data: history }, { count: unreadCount }, { data: profile }] = await Promise.all([
    supabase.from("daily_integrated_insights").select("id,insight_date,status,summary,strengths,clues,adjustments,next_action,question,is_read,created_at").eq("user_id", user.id).eq("insight_date", date).maybeSingle(),
    supabase.from("daily_integrated_insights").select("id,insight_date,status,summary,strengths,clues,adjustments,next_action,question,is_read,created_at,daily_insight_answers(answer)").eq("user_id", user.id).order("insight_date", { ascending: false }).limit(31),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    supabase.from("profiles").select("week_starts_on").eq("id", user.id).maybeSingle(),
  ]);
  const answer = insight ? (await supabase.from("daily_insight_answers").select("answer,updated_at").eq("user_id", user.id).eq("insight_id", insight.id).maybeSingle()).data : null;
  const historyWithAnswers = (history as HistoryRow[] | null ?? []).map((item) => ({ ...item, hasAnswer: (item.daily_insight_answers?.length ?? 0) > 0 }));
  const calendar = historyWithAnswers.map((item) => ({ date: item.insight_date, label: item.hasAnswer ? "✅" : "❓" }));
  return <AppShell><TodayClient date={date} tab={tab} insight={insight} answer={answer} history={historyWithAnswers} calendar={calendar} weekStartsOn={profile?.week_starts_on === "sunday" ? "sunday" : "monday"} unreadCount={unreadCount ?? 0} /></AppShell>;
}
