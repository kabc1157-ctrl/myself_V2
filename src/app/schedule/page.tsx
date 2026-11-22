import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { getCalendarConnection, listCalendarEventsRange } from "@/core/integrations/google-calendar/repository";
import { ScheduleClient } from "./schedule-client";
import { PlanningClient } from "./planning-client";
import { ScheduleDetailClient } from "./schedule-detail-client";
import { GoogleCalendarPanel } from "./google-calendar-panel";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const profile = await supabase.from("profiles").select("timezone,week_starts_on").eq("user_id", user.id).maybeSingle(); const timeZone = profile.data?.timezone || "Asia/Seoul"; const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date()); const requested = (await searchParams).date;
  const date = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested <= today ? requested : today; const month = date.slice(0, 7); const lastDay = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  let result: Awaited<ReturnType<typeof listCalendarEventsRange>> & { month: string } = { connected: false, events: [], month };
  try { result = { ...(await listCalendarEventsRange(user.id, `${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`, timeZone)), month }; } catch { result = { connected: true, unavailable: true, errorCode: "server_error", events: [], month }; }
  const connection = await getCalendarConnection(user.id);
  const [{data:todos},{data:priorities},{data:dumps},{data:plans},{data:timers},{data:settings},{data:reflection}]=await Promise.all([
    supabase.from("todos").select("*,projects(id,title)").eq("user_id",user.id).or(`planned_date.eq.${date},planned_date.is.null`).order("is_completed").order("created_at"),
    supabase.from("priority_slots").select("*,todos(id,title,is_completed)").eq("user_id",user.id).eq("priority_date",date).order("rank"),
    supabase.from("brain_dumps").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
    supabase.from("planned_schedule_entries").select("*,todos(id,title,is_completed)").eq("user_id",user.id).eq("plan_date",date).order("starts_at"),
    supabase.from("timer_sessions").select("*,todos(id,title)").eq("user_id",user.id).eq("session_date",date).order("created_at",{ascending:false}),
    supabase.from("profiles").select("day_starts_at,day_ends_at").eq("user_id",user.id).single(),
    supabase.from("schedule_reflections").select("id,reflection_date,content").eq("user_id",user.id).eq("reflection_date",date).is("deleted_at",null).maybeSingle()
  ]);
  const [{data:calendarAreas},{data:googleCompleted}]=await Promise.all([
    supabase.from("calendar_event_life_areas").select("event_id,event_date,life_area").eq("user_id",user.id).eq("event_date",date),
    supabase.from("schedule_completions").select("source_id,completion_date").eq("user_id",user.id).eq("completion_date",date).eq("source_type","google"),
  ]);
  const googleEvents=result.events.filter(event=>event.date===date);
  const planning=<><div className="schedule-top-google"><GoogleCalendarPanel date={date} events={result.events} areaRecords={calendarAreas??[]} completedEvents={googleCompleted??[]} connected={Boolean(connection)&&Boolean(result.connected)} needsReconnect={result.needsReconnect} unavailable={result.unavailable} /></div><PlanningClient key="schedule-planning" date={date} todos={todos??[]} priorities={priorities??[]} dumps={dumps??[]} plans={plans??[]} timers={timers??[]} dayStart={settings?.day_starts_at??"07:00"} dayEnd={settings?.day_ends_at??"23:00"} googleEvents={googleEvents} googleConnected={Boolean(connection)&&Boolean(result.connected)} googleNeedsReconnect={result.needsReconnect} googleUnavailable={result.unavailable}/></>;
  const detail=<ScheduleDetailClient key="schedule-detail" date={date} todos={(todos??[]).filter(todo=>todo.planned_date===date)} plans={plans??[]} timers={timers??[]} priorities={priorities??[]} googleEvents={googleEvents} reflection={reflection??null} weekStartsOn={profile.data?.week_starts_on === "sunday" ? "sunday" : "monday"}/>;
  return <AppShell><ScheduleClient date={date} today={today} weekStartsOn={profile.data?.week_starts_on === "sunday" ? "sunday" : "monday"} initial={result} planning={planning} detail={detail} /></AppShell>;
}
