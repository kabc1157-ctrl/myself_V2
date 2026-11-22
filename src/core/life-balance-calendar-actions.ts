"use server";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { listCalendarEventsRange } from "@/core/integrations/google-calendar/repository";
import { isLifeArea, type LifeArea } from "@/core/life-balance";
import { revalidatePath } from "next/cache";

export async function setCalendarLifeArea(input: { eventId: string; eventDate: string; lifeArea: LifeArea | null }) {
  if (!input.eventId || input.eventId.length > 512 || !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) || (input.lifeArea !== null && !isLifeArea(input.lifeArea)))
    return { ok: false, error: "일정과 삶 영역을 확인해 주세요." };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  if (input.lifeArea !== null) {
    // Verify the Google event actually belongs to this user's connected calendar.
    try {
      const next = new Date(input.eventDate + "T00:00:00Z");
      next.setUTCDate(next.getUTCDate() + 1);
      const { data: profile } = await supabase.from("profiles").select("timezone").eq("user_id", user.id).maybeSingle();
      const calendar = await listCalendarEventsRange(user.id, input.eventDate, next.toISOString().slice(0,10), profile?.timezone || "Asia/Seoul");
      if (!calendar.connected || !calendar.events.some(event => event.id === input.eventId && event.date === input.eventDate))
        return { ok: false, error: "연결된 캘린더에서 일정을 찾지 못했어요." };
    } catch {
      return { ok: false, error: "캘린더 연결을 확인해 주세요." };
    }
  }
  const result = input.lifeArea === null
    ? await supabase.from("calendar_event_life_areas").delete().eq("user_id",user.id).eq("event_id",input.eventId).eq("event_date",input.eventDate)
    : await supabase.from("calendar_event_life_areas").upsert({
        user_id: user.id, event_id: input.eventId, event_date: input.eventDate, life_area: input.lifeArea,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,event_id,event_date" });
  if (result.error) return { ok: false, error: "삶 영역을 저장하지 못했어요." };
  revalidatePath("/schedule"); revalidatePath("/home");
  return { ok: true };
}
