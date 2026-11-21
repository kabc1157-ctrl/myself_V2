import Link from "next/link";
import { redirect } from "next/navigation";
import { PERSONALITY_ASSESSMENT_VERSION } from "@/core/personality/questions";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { AppShell } from "@/shared/components/app-shell";
import { MyPagePersonalityAssessment } from "./personality-client";

export default async function MyPagePersonalityPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: assessment, error } = await supabase
    .from("personality_assessments")
    .select("status,version,answers_json")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return <AppShell><p role="alert">검사 진행 상태를 확인하지 못했어요.</p></AppShell>;
  if (assessment?.status === "completed") redirect("/mypage/personality/report");

  const incompatible = assessment && (assessment.status !== "in_progress" || assessment.version !== PERSONALITY_ASSESSMENT_VERSION);
  return <AppShell><div className="mx-auto max-w-2xl">
    <Link href="/mypage" className="mb-4 inline-block text-sm text-[#8B682C]">마이페이지로 돌아가기</Link>
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-7">
      {incompatible ? <div role="alert" className="text-sm leading-7">
        기존에 저장한 검사 버전이 현재 버전과 달라요. 기존 응답을 임의로 변경하거나 삭제하지 않고 보관 중입니다.
      </div> : <MyPagePersonalityAssessment initialAnswers={
        assessment?.answers_json && typeof assessment.answers_json === "object" && !Array.isArray(assessment.answers_json)
          ? (assessment.answers_json as Record<string,string>) : {}
      } />}
    </div>
    <p className="mt-4 text-center text-xs leading-6 text-stone-500">성향 검사는 계정당 최초 1회만 완료할 수 있어요. 건너뛴 경우에도 여기서 처음 응시할 수 있어요.</p>
  </div></AppShell>;
}
