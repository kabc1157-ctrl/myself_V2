import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { TimerClient } from "./timer-client";

export default async function ScheduleTimerPage({ searchParams }: { searchParams: Promise<{ todo?: string; plan?: string; date?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/schedule/timer");
  const params = await searchParams;
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const todoId = params.todo;
  if (!todoId) return <AppShell><TimerClient date={date} todo={null} plan={null} session={null} otherActive={false} /></AppShell>;
  const [{ data: todo }, { data: requestedPlan }, { data: activeSessions }] = await Promise.all([
    supabase.from("todos").select("id,title").eq("id", todoId).eq("user_id", user.id).maybeSingle(),
    params.plan ? supabase.from("planned_schedule_entries").select("id,todo_id,starts_at,ends_at").eq("id", params.plan).eq("todo_id", todoId).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("timer_sessions").select("id,todo_id,status,started_at,accumulated_seconds,manual_seconds").eq("user_id", user.id).in("status", ["running", "paused"])
  ]);
  const { data: fallbackPlan } = requestedPlan ? { data: null } : await supabase.from("planned_schedule_entries").select("id,todo_id,starts_at,ends_at").eq("todo_id", todoId).eq("plan_date", date).eq("user_id", user.id).maybeSingle();
  const session = (activeSessions ?? []).find((item) => item.todo_id === todoId) ?? null;
  return <AppShell><TimerClient date={date} todo={todo} plan={requestedPlan ?? fallbackPlan} session={session} otherActive={(activeSessions ?? []).some((item) => item.todo_id !== todoId)} /></AppShell>;
}
