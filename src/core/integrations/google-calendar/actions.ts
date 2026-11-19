"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { deleteCalendarEvent, mutateCalendarEvent } from "./repository";

const schema = z.object({ eventId: z.string().optional(), title: z.string().trim().min(1).max(200), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), allDay: z.string().optional(), startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), endTime: z.string().regex(/^\d{2}:\d{2}$/).optional() });

export async function saveCalendarEvent(input: unknown) {
  const parsed = schema.safeParse(input); if (!parsed.success) return { ok: false, error: "일정 제목·날짜·시간을 확인해 주세요." };
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { ok: false, error: "로그인이 필요합니다." };
  if (!parsed.data.allDay && (!parsed.data.startTime || !parsed.data.endTime)) return { ok: false, error: "시작 시간과 종료 시간을 입력해 주세요." };
  try { await mutateCalendarEvent(user.id, { ...parsed.data, allDay: parsed.data.allDay === "true", timeZone: "Asia/Seoul" }); return { ok: true }; } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "일정을 저장하지 못했어요." }; }
}

export async function removeCalendarEvent(eventId: string) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return { ok: false, error: "로그인이 필요합니다." };
  if (!eventId) return { ok: false, error: "일정 ID가 필요합니다." };
  try { await deleteCalendarEvent(user.id, eventId); return { ok: true }; } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "일정을 삭제하지 못했어요." }; }
}
