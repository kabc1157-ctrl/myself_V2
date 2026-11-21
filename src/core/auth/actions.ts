"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { toKoreanAuthError, type AuthActionState } from "@/core/auth/error-message";

function value(formData: FormData, name: string) { return String(formData.get(name) ?? "").trim(); }
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://myselfv2.vercel.app";
function callbackUrl(next: string) { const url = new URL("/auth/callback", siteUrl); url.searchParams.set("next", next); return url.toString(); }

export async function signUp(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = value(formData, "email");
  const password = value(formData, "password");
  const nickname = value(formData, "nickname");
  const passwordConfirm = value(formData, "passwordConfirm");
  if (!nickname) return { error: "닉네임을 입력해 주세요." };
  if (!passwordConfirm || password !== passwordConfirm) return { error: "비밀번호가 일치하지 않아요." };
  if (formData.get("terms") !== "on") return { error: "필수 약관에 동의해 주세요." };
  if (!email) return { error: "이메일 주소를 입력해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상으로 설정해 주세요." };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nickname }, emailRedirectTo: `${siteUrl}/auth/callback` } });
    if (error) return { error: toKoreanAuthError(error) };
    return { message: "가입 확인 메일을 확인해 주세요." };
  } catch (error) {
    return { error: toKoreanAuthError({ message: error instanceof Error ? error.message : "" }) };
  }
}

export async function signIn(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: value(formData, "email"), password: value(formData, "password") });
  if (error) return { error: toKoreanAuthError(error) };
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("onboarding_step").eq("user_id", user.id).maybeSingle() : { data: null };
  redirect(profile?.onboarding_step === "completed" ? "/home" : "/onboarding");
}

export async function signOut() { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); redirect("/auth/login"); }

export async function requestPasswordReset(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(value(formData, "email"), { redirectTo: callbackUrl("/auth/reset") });
  if (error) return { error: toKoreanAuthError(error) };
  return { message: "비밀번호 재설정 메일을 확인해 주세요." };
}

export async function updatePassword(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();
  const password = value(formData, "password");
  if (password.length < 8) return { error: "비밀번호는 8자 이상으로 설정해 주세요." };
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "재설정 링크가 만료되었거나 유효하지 않습니다. 새 재설정 메일을 요청해 주세요." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: toKoreanAuthError(error) };
  return { message: "비밀번호가 변경됐습니다. 아래 버튼으로 로그인 화면으로 이동해 주세요." };
}
