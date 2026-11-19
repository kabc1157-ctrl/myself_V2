import "server-only";
import { createSupabaseAdminClient } from "@/core/supabase/admin";
import { decryptGoogleToken, encryptGoogleToken } from "./crypto";

export type CalendarEvent = { id: string; title: string; date: string; allDay: boolean; startTime: string | null; endTime: string | null; htmlLink: string | null };
type GoogleEvent = { id?: string; summary?: string; status?: string; htmlLink?: string; start?: { date?: string; dateTime?: string }; end?: { date?: string; dateTime?: string } };

function shiftDate(date: string, amount: number) { const value = new Date(date + "T00:00:00Z"); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }
function localDateIso(date: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number); const guess = Date.UTC(year, month - 1, day);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
  const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return new Date(guess - (represented - guess)).toISOString();
}
async function refresh(refreshToken: string) {
  if (!process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET) return null;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID, client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET, refresh_token: refreshToken, grant_type: "refresh_token" }), cache: "no-store" });
  if (!response.ok) { let errorCode = `google_token_http_${response.status}`; try { const body = await response.json() as { error?: string }; errorCode = body.error ?? errorCode; } catch { /* keep the HTTP status only */ } console.warn("[google calendar] token refresh failed", { status: response.status, errorCode }); return null; } return response.json() as Promise<{ access_token: string; expires_in: number }>;
}
async function credentials(userId: string, forceRefresh = false) {
  const admin = createSupabaseAdminClient(); const { data } = await admin.from("google_calendar_connections").select("access_token_ciphertext,refresh_token_ciphertext,access_token_expires_at,calendar_id").eq("user_id", userId).maybeSingle();
  if (!data) return null; let accessToken = decryptGoogleToken(data.access_token_ciphertext);
  if (forceRefresh || new Date(data.access_token_expires_at).getTime() <= Date.now() + 60000) {
    if (!data.refresh_token_ciphertext) return null; const next = await refresh(decryptGoogleToken(data.refresh_token_ciphertext)); if (!next) return null;
    accessToken = next.access_token; await admin.from("google_calendar_connections").update({ access_token_ciphertext: encryptGoogleToken(accessToken), access_token_expires_at: new Date(Date.now() + next.expires_in * 1000).toISOString(), updated_at: new Date().toISOString() }).eq("user_id", userId);
  }
  return { accessToken, calendarId: data.calendar_id };
}
export async function getCalendarConnection(userId: string) { const admin = createSupabaseAdminClient(); const { data } = await admin.from("google_calendar_connections").select("user_id,account_email,calendar_id,connected_at,updated_at").eq("user_id", userId).maybeSingle(); return data; }
export async function listCalendarEvents(userId: string, date: string, timeZone = "Asia/Seoul") {
  return listCalendarEventsRange(userId, date, shiftDate(date, 1), timeZone);
}
export async function listCalendarEventsRange(userId: string, startDate: string, endDate: string, timeZone = "Asia/Seoul") {
  const connection = await getCalendarConnection(userId); if (!connection) return { connected: false, events: [] as CalendarEvent[] };
  const auth = await credentials(userId); if (!auth) return { connected: true, needsReconnect: true, events: [] as CalendarEvent[] };
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(auth.calendarId) + "/events");
  url.searchParams.set("timeMin", localDateIso(startDate, timeZone)); url.searchParams.set("timeMax", localDateIso(endDate, timeZone)); url.searchParams.set("singleEvents", "true"); url.searchParams.set("orderBy", "startTime"); url.searchParams.set("maxResults", "2500"); url.searchParams.set("timeZone", timeZone);
  let response = await fetch(url, { headers: { Authorization: "Bearer " + auth.accessToken }, cache: "no-store" });
  if (response.status === 401) {
    const refreshed = await credentials(userId, true);
    if (!refreshed) return { connected: true, needsReconnect: true, errorCode: "reauthentication_required", events: [] as CalendarEvent[] };
    response = await fetch(url, { headers: { Authorization: "Bearer " + refreshed.accessToken }, cache: "no-store" });
  }
  if (!response.ok) {
    let errorCode = `google_http_${response.status}`;
    try { const body = await response.json() as { error?: { status?: string; reason?: string } }; errorCode = body.error?.reason ?? body.error?.status ?? errorCode; } catch { /* keep the HTTP status only */ }
    console.warn("[google calendar] events request failed", { status: response.status, errorCode });
    return { connected: true, unavailable: true, errorCode, events: [] as CalendarEvent[] };
  }
  const payload = await response.json() as { items?: GoogleEvent[] };
  const eventDate = (value: string | undefined) => value ? new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : startDate;
  const events = (payload.items ?? []).filter((event) => event.status !== "cancelled").map((event, index) => ({ id: event.id ?? "event-" + index, title: event.summary?.trim() || "제목 없는 일정", date: event.start?.date ?? eventDate(event.start?.dateTime), allDay: Boolean(event.start?.date && !event.start?.dateTime), startTime: event.start?.dateTime ?? null, endTime: event.end?.dateTime ?? null, htmlLink: event.htmlLink ?? null }));
  return { connected: true, events };
}
export async function mutateCalendarEvent(userId: string, input: { eventId?: string; title: string; date: string; allDay: boolean; startTime?: string; endTime?: string; timeZone: string }) {
  const auth = await credentials(userId); if (!auth) throw new Error("Google Calendar를 다시 연결해 주세요.");
  const body = input.allDay ? { summary: input.title, start: { date: input.date }, end: { date: shiftDate(input.date, 1) } } : { summary: input.title, start: { dateTime: input.date + "T" + input.startTime + ":00", timeZone: input.timeZone }, end: { dateTime: input.date + "T" + input.endTime + ":00", timeZone: input.timeZone } };
  const url = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(auth.calendarId) + "/events" + (input.eventId ? "/" + encodeURIComponent(input.eventId) : "");
  const response = await fetch(url, { method: input.eventId ? "PATCH" : "POST", headers: { Authorization: "Bearer " + auth.accessToken, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" }); if (!response.ok) throw new Error("Google Calendar 일정 저장에 실패했어요."); return response.json();
}
export async function deleteCalendarEvent(userId: string, eventId: string) { const auth = await credentials(userId); if (!auth) throw new Error("Google Calendar를 다시 연결해 주세요."); const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(auth.calendarId) + "/events/" + encodeURIComponent(eventId), { method: "DELETE", headers: { Authorization: "Bearer " + auth.accessToken }, cache: "no-store" }); if (!response.ok && response.status !== 410) throw new Error("Google Calendar 일정 삭제에 실패했어요."); }
