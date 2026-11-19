import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createSupabaseAdminClient } from "@/core/supabase/admin";
import { encryptGoogleToken } from "@/core/integrations/google-calendar/crypto";

export async function GET(request: Request) {
  const base = new URL("/mypage", request.url); const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
  const url = new URL(request.url); const store = await cookies(); const expected = store.get("google_calendar_oauth_state")?.value; store.delete("google_calendar_oauth_state");
  const code = url.searchParams.get("code"); const state = url.searchParams.get("state"); if (!code || !state || !expected || code.length > 2048 || state !== expected) { base.searchParams.set("calendar", "denied"); return NextResponse.redirect(base); }
  if (!process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET || !process.env.GOOGLE_CALENDAR_REDIRECT_URI || !process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY) { base.searchParams.set("calendar", "setup-required"); return NextResponse.redirect(base); }
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID, client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET, code, grant_type: "authorization_code", redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI }), cache: "no-store" });
  if (!response.ok) { base.searchParams.set("calendar", "token-error"); return NextResponse.redirect(base); }
  const token = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!token.access_token || !token.expires_in) { base.searchParams.set("calendar", "token-error"); return NextResponse.redirect(base); }
  const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary", { headers: { Authorization: "Bearer " + token.access_token }, cache: "no-store" }); const calendar = calendarResponse.ok ? await calendarResponse.json() as { id?: string; summary?: string } : {};
  const admin = createSupabaseAdminClient(); const { data: previous } = await admin.from("google_calendar_connections").select("refresh_token_ciphertext").eq("user_id", user.id).maybeSingle();
  const { error } = await admin.from("google_calendar_connections").upsert({ user_id: user.id, access_token_ciphertext: encryptGoogleToken(token.access_token), refresh_token_ciphertext: token.refresh_token ? encryptGoogleToken(token.refresh_token) : previous?.refresh_token_ciphertext ?? null, access_token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(), account_email: calendar.summary ?? null, calendar_id: calendar.id ?? "primary", connected_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  base.searchParams.set("calendar", error ? "save-error" : "connected"); return NextResponse.redirect(base);
}
