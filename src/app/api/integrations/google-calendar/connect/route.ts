import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/core/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
  if (!process.env.GOOGLE_CALENDAR_CLIENT_ID || !process.env.GOOGLE_CALENDAR_CLIENT_SECRET || !process.env.GOOGLE_CALENDAR_REDIRECT_URI || !process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY || !process.env.SUPABASE_SECRET_KEY) return NextResponse.redirect(new URL("/mypage?calendar=setup-required", request.url));
  const state = randomBytes(24).toString("base64url"); const store = await cookies(); store.set("google_calendar_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth"); url.searchParams.set("client_id", process.env.GOOGLE_CALENDAR_CLIENT_ID); url.searchParams.set("redirect_uri", process.env.GOOGLE_CALENDAR_REDIRECT_URI); url.searchParams.set("response_type", "code"); url.searchParams.set("access_type", "offline"); url.searchParams.set("prompt", "consent"); url.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendars.readonly"); url.searchParams.set("state", state);
  return NextResponse.redirect(url);
}
