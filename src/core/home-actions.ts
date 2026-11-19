"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "./supabase/server";

const allowed = new Set(["todo", "checklist", "memo", "project"]);

export async function saveHomeSummaryOrder(order: string[]) {
  const normalized = [...new Set(order.filter((key) => allowed.has(key)))];
  if (normalized.length !== order.length) return { ok: false, error: "홈 요약 순서를 확인해 주세요." };
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요." };
  const { error } = await supabase.from("home_summary_preferences").upsert({ user_id: user.id, summary_order: normalized, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    console.error("[home-action] summary order save failed", { code: error.code });
    return { ok: false, error: error.code === "42P01" ? "홈 요약 설정 DB가 아직 준비되지 않았어요." : "홈 요약 순서를 저장하지 못했어요." };
  }
  revalidatePath("/home");
  return { ok: true };
}
