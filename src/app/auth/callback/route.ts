import { createSupabaseServerClient } from "@/core/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/home";
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL(`${destination}?link=invalid`, request.url));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/reset?link=invalid", request.url));
  return NextResponse.redirect(new URL(destination, request.url));
}
