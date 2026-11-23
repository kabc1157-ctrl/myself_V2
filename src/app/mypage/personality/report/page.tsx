import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { isPersonalityReportSnapshot } from "@/core/personality/snapshot";
import { deriveStoredPersonalityReportV2 } from "@/core/personality/report-v2";
import { isPersonalityReportV2 } from "@/core/personality/snapshot-v2";
import { AppShell } from "@/shared/components/app-shell";
import { PersonalityReportView } from "./personality-report-view";

export default async function MyPersonalityReportPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("personality_assessments")
    .select("status,answers_json,scores_json,report_json,completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return <AppShell><p role="alert" className="rounded-xl border p-5">성향 리포트를 불러오지 못했어요. 다시 시도해 주세요.</p></AppShell>;
  }
  if (!data || data.status !== "completed") redirect("/mypage/personality");

  if (!isPersonalityReportSnapshot(data.report_json) && !isPersonalityReportV2(data.report_json)) {
    return <AppShell><div className="rounded-xl border p-5"><p>저장된 리포트 형식을 확인할 수 없어요. 원본 결과는 변경되지 않았습니다.</p><Link className="mt-3 inline-block underline" href="/mypage">마이페이지로</Link></div></AppShell>;
  }

  let report;
  try {
    report = deriveStoredPersonalityReportV2(data.answers_json, data.scores_json);
    if (!isPersonalityReportV2(report)) throw new Error("리포트 형식이 올바르지 않습니다.");
  } catch {
    return <AppShell><div role="alert" className="rounded-xl border p-5"><p>저장된 답변과 점수의 무결성을 확인하지 못해 새 리포트를 표시할 수 없어요. 원본 결과는 그대로 보존됩니다.</p><Link className="mt-3 inline-block underline" href="/mypage">마이페이지로</Link></div></AppShell>;
  }

  return <AppShell><div className="mx-auto max-w-3xl">
    <nav className="mb-4 text-sm"><Link href="/mypage" className="text-[#8B682C]">마이페이지로 돌아가기</Link></nav>
    <PersonalityReportView report={report} completedAt={data.completed_at}/>
  </div></AppShell>;
}
