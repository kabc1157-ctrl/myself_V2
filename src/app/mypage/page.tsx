import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { getCalendarConnection } from "@/core/integrations/google-calendar/repository";
import { AppShell } from "@/shared/components/app-shell";
import { GoogleCalendarPanel } from "./google-calendar-panel";
import { MyPageSettings } from "./settings-form";
import { AccountActions } from "./account-actions";
const MODULES = ["memo", "exercise", "reading", "payroll", "investment", "schedule"] as const;
const LABELS: Record<string, string> = { memo: "메모", exercise: "운동 기록", reading: "독서 기록", payroll: "월급 관리", investment: "투자", schedule: "일정 관리" };
const timeInputValue = (value: string | null | undefined, fallback: string) => { const normalized = value?.slice(0, 5); return normalized && /^\d{2}:\d{2}$/.test(normalized) ? normalized : fallback; };
export default async function MyPage({ searchParams }: { searchParams: Promise<{ calendar?: string }> }) {
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/auth/login");
  const [{ data: profile }, { data: preferences }, { data: navigation }] = await Promise.all([supabase.from("profiles").select("nickname,week_starts_on,ai_feedback_style,day_starts_at,day_ends_at,assessment_status").eq("user_id", user.id).maybeSingle(), supabase.from("module_preferences").select("module_key,enabled").eq("user_id", user.id), supabase.from("navigation_preferences").select("module_order").eq("user_id", user.id).maybeSingle()]);
  const { data: personAssessment } = await supabase.from("personality_assessments").select("status").eq("user_id", user.id).maybeSingle();
  const personalityStatus = personAssessment?.status === "completed" ? "completed" : personAssessment?.status === "locked" ? "locked" : personAssessment?.status === "in_progress" ? "in_progress" : profile?.assessment_status === "skipped" ? "skipped" : "not_started";
  const personalityLabel = personalityStatus === "completed" ? "나의 성향 리포트 보기" : personalityStatus === "in_progress" ? "이어서 검사하기" : personalityStatus === "locked" ? "검사 상태 확인하기" : "성향 검사 시작하기";
  let connection = null; try { connection = await getCalendarConnection(user.id); } catch {}
  const notice = (await searchParams).calendar; const enabled = Object.fromEntries((preferences ?? []).map(x => [x.module_key, x.enabled])); const modules = MODULES.map(key => ({ key, label: LABELS[key], enabled: enabled[key] === true })); const saved = Array.isArray(navigation?.module_order) ? navigation.module_order.filter((x): x is string => MODULES.includes(x as typeof MODULES[number])) : []; const order = [...new Set([...saved, ...MODULES])];
  return <AppShell activeModules={modules.filter(x => x.enabled).map(x => x.key)}><div className="record-page mypage-page"><div className="record-heading"><div><p>설정</p><h1>마이페이지</h1><p className="record-muted">{profile?.nickname ? `${profile.nickname} 안녕하세요:)` : "안녕하세요:)"}</p></div></div><section className="mb-4 rounded-2xl border border-[#EDD8B3] bg-[#FFF8EC] p-5">
    <h2 className="text-lg font-semibold">나의 성향</h2>
    <p className="mt-2 text-sm text-stone-600">{personalityStatus==="completed"?"최초 검사 결과를 보관 중이에요. 재검사는 할 수 없어요.":personalityStatus==="in_progress"?"응답을 저장해 두었어요. 이어서 완료할 수 있어요.":"검사는 선택이에요. 건너뛰었다면 여기서 최초 1회 응시할 수 있어요."}</p>
    <Link className="mt-4 inline-block rounded-xl bg-[#FFBE46] px-5 py-3 text-sm font-semibold text-stone-900" href={personalityStatus==="completed"?"/mypage/personality/report":"/mypage/personality"}>{personalityLabel}</Link>
  </section><MyPageSettings initial={{ nickname: profile?.nickname ?? "", weekStartsOn: profile?.week_starts_on === "sunday" ? "sunday" : "monday", aiFeedbackStyle: profile?.ai_feedback_style === "problem_solving" ? "problem_solving" : "empathetic", dayStartsAt: timeInputValue(profile?.day_starts_at, "07:00"), dayEndsAt: timeInputValue(profile?.day_ends_at, "23:00") }} modules={modules} initialOrder={order} /><GoogleCalendarPanel connection={connection} notice={notice} /><details className="mypage-collapsible"><summary>홈화면 설치 가이드</summary><div className="mypage-install-guide"><h3>iPhone·iPad Safari</h3><p>Safari에서 이음새를 연 뒤 공유 버튼을 누르고 ‘홈 화면에 추가’를 선택하세요.</p><h3>Android Chrome</h3><p>Chrome 메뉴에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 선택하세요.</p></div></details><AccountActions /></div></AppShell>;
}
