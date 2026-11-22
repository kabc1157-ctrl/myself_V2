import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("nickname,timezone,onboarding_step,assessment_status").eq("user_id", user.id).maybeSingle();
  if (profile?.onboarding_step === "completed") redirect("/home");
  const { data: assessment } = await supabase.from("personality_assessments").select("answers_json").eq("user_id", user.id).eq("status", "in_progress").maybeSingle();
  const { data: modules } = await supabase.from("module_preferences").select("module_key,enabled").eq("user_id", user.id);
  const { data: consents } = await supabase.from("ai_consents").select("consent_key,consented").eq("user_id", user.id);
  return <OnboardingFlow initial={{ assessmentStatus: profile?.assessment_status ?? "not_started", nickname: profile?.nickname ?? "", timezone: profile?.timezone ?? "Asia/Seoul", step: profile?.onboarding_step ?? "profile", answers: (assessment?.answers_json as Record<string, string> | null) ?? {}, modules: modules?.filter((item) => item.enabled).map((item) => item.module_key) ?? [], consents: Object.fromEntries((consents ?? []).map((item) => [item.consent_key, item.consented])) }} />;
}
