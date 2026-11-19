import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createSupabaseAdminClient } from "@/core/supabase/admin";
import { decryptGoogleToken } from "@/core/integrations/google-calendar/crypto";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));
  const admin = createSupabaseAdminClient(); const { data } = await admin.from("google_calendar_connections").select("access_token_ciphertext").eq("user_id", user.id).maybeSingle();
  if (data?.access_token_ciphertext) { try { await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(decryptGoogleToken(data.access_token_ciphertext)), { method: "POST", cache: "no-store" }); } catch { /* 내부 연결 삭제는 계속한다. */ } }
  const { error } = await admin.from("google_calendar_connections").delete().eq("user_id", user.id); const target = new URL("/mypage", request.url); target.searchParams.set("calendar", error ? "disconnect-error" : "disconnected"); return NextResponse.redirect(target, 303);
}
