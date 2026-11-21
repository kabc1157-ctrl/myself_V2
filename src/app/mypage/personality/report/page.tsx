import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { isPersonalityReportSnapshot } from "@/core/personality/snapshot";
import { AppShell } from "@/shared/components/app-shell";
import { PersonalityReportView } from "./personality-report-view";

export default async function MyPersonalityReportPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("personality_assessments")
    .select("status,report_json,completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return <AppShell><p role="alert" className="rounded-xl border p-5">성향 리포트를 불러오지 못했어요. 다시 시도해 주세요.</p></AppShell>;
  }
  if (!data || data.status !== "completed") redirect("/mypage/personality");

  if (!isPersonalityReportSnapshot(data.report_json)) {
    return <AppShell><div className="rounded-xl border p-5"><p>저장된 리포트 형식을 확인할 수 없어요. 원본 결과는 변경되지 않았습니다.</p><Link className="mt-3 inline-block underline" href="/mypage">마이페이지로</Link></div></AppShell>;
  }

  return <AppShell><div className="mx-auto max-w-3xl">
    <nav className="mb-4 text-sm"><Link href="/mypage" className="text-[#8B682C]">마이페이지로 돌아가기</Link></nav>
    <PersonalityReportView report={data.report_json} completedAt={data.completed_at}/>
  </div></AppShell>;
}
