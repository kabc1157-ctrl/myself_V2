import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { ExerciseClient } from "./exercise-client";
function kstDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function isDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export default async function ExercisePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const s = await createSupabaseServerClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const today = kstDate();
  const date = isDate(params.date) ? params.date : today;
  const month = date.slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);

  const [recordsResult, profileResult] = await Promise.all([
    s.from("exercise_records")
      .select("id,exercise_date,exercise_type,focus_area,memo,created_at,updated_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("exercise_date", `${month}-01`)
      .lt("exercise_date", nextMonth)
      .order("created_at", { ascending: false }),
    s.from("profiles").select("week_starts_on").eq("user_id", user.id).maybeSingle(),
  ]);

  if (recordsResult.error) {
    console.error("[exercise] records query failed", {
      code: recordsResult.error.code,
      message: recordsResult.error.message,
    });
  }

  return <AppShell><ExerciseClient
    today={today}
    date={date}
    month={month}
    weekStartsOn={profileResult.data?.week_starts_on === "sunday" ? "sunday" : "monday"}
    records={recordsResult.data ?? []}
  /></AppShell>;
}
