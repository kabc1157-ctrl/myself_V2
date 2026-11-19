"use server";
import { createSupabaseServerClient } from "@/core/supabase/server";
export async function updateWeekStart(value: "monday" | "sunday") { const supabase=await createSupabaseServerClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return {ok:false,error:"로그인이 필요합니다."}; const {error}=await supabase.from("profiles").update({week_starts_on:value,updated_at:new Date().toISOString()}).eq("user_id",user.id); return error?{ok:false,error:"한 주 시작일을 저장하지 못했어요."}:{ok:true}; }
