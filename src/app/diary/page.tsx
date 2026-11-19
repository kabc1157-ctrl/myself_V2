import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { DiaryScreen } from "./diary-screen";

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const date = (await searchParams).date ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${date}T00:00:00Z`); const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)).toISOString().slice(0, 10); const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const { data: entries } = await supabase.from("diary_entries").select("id,entry_date,title,emotion_emoji,emotion_score,content,created_at,updated_at").eq("user_id", user.id).eq("entry_date", date).is("deleted_at", null).order("created_at", { ascending: false });
  const { data: monthEntries } = await supabase.from("diary_entries").select("id,entry_date,emotion_emoji,emotion_score").eq("user_id", user.id).gte("entry_date", monthStart).lte("entry_date", monthEnd).is("deleted_at", null);
  return <AppShell><DiaryScreen key={date} date={date} initialEntries={entries ?? []} initialMonthEntries={monthEntries ?? []} /></AppShell>;
}
