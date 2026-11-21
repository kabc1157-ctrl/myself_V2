"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CollapsibleBlock } from "@/shared/components/app-shell";
import { useToast } from "@/shared/components/toast-provider";
import { getAiConsents, startPersonalityAssessment, updateAiConsents, updateModulePreferences, updateMyPageSettings, updateNavigationOrder } from "@/core/profile/settings-actions";

type Settings = { nickname: string; weekStartsOn: "monday" | "sunday"; aiFeedbackStyle: "empathetic" | "problem_solving"; dayStartsAt: string; dayEndsAt: string };
type Module = { key: string; label: string; enabled: boolean };

const labels: Record<string, string> = { schedule: "일정", reading: "독서", exercise: "운동", memo: "메모", investment: "투자", payroll: "월급", goal: "목표" };

export function MyPageSettings({ initial, modules, initialOrder }: { initial: Settings; modules: Module[]; initialOrder: string[] }) {
  const [settings, setSettings] = useState(initial); const [moduleValues, setModuleValues] = useState(Object.fromEntries(modules.map((item) => [item.key, item.enabled]))); const [order, setOrder] = useState(initialOrder); const [pending, start] = useTransition(); const [basicOpen, setBasicOpen] = useState(false); const [scheduleOpen, setScheduleOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false); const router = useRouter(); const { showToast } = useToast();
  const [consents, setConsents] = useState<Record<string, boolean>>({}); const [aiOpen, setAiOpen] = useState(false); const [personalityOpen, setPersonalityOpen] = useState(false);
  useEffect(() => { void getAiConsents().then(setConsents); }, []);
  const save = (work: () => Promise<{ ok: boolean; error?: string }>, success: string, close?: () => void) => start(async () => { const result = await work(); showToast(result.ok ? success : result.error ?? "저장하지 못했어요.", result.ok ? "success" : "error"); if (result.ok) { close?.(); router.refresh(); window.dispatchEvent(new Event("ieumsae:preferences-changed")); } });
  const move = (index: number, delta: -1 | 1) => { const next = [...order]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setOrder(next); };
  return <div className="mypage-settings-grid">
    <CollapsibleBlock title="기본 설정" open={basicOpen} onOpenChange={setBasicOpen}><div className="mypage-form-grid">
      <label>닉네임<input value={settings.nickname} onChange={(e) => setSettings({ ...settings, nickname: e.target.value })} placeholder="닉네임" /></label>
      <label>한 주 시작<select value={settings.weekStartsOn} onChange={(e) => setSettings({ ...settings, weekStartsOn: e.target.value as Settings["weekStartsOn"] })}><option value="monday">월요일</option><option value="sunday">일요일</option></select></label>
      <label>AI 성향<select value={settings.aiFeedbackStyle} onChange={(e) => setSettings({ ...settings, aiFeedbackStyle: e.target.value as Settings["aiFeedbackStyle"] })}><option value="empathetic">공감형</option><option value="problem_solving">문제해결형</option></select></label>
      <button type="button" className="record-button" disabled={pending} onClick={() => save(() => updateMyPageSettings(settings), "기본 설정을 저장했어요.", () => setBasicOpen(false))}>저장</button>
    </div></CollapsibleBlock>
    <CollapsibleBlock title="하루 시간표 설정" open={scheduleOpen} onOpenChange={setScheduleOpen}><div className="mypage-form-grid"><label>기상 시간<input type="time" value={settings.dayStartsAt} onChange={e=>setSettings({...settings,dayStartsAt:e.target.value})}/></label><label>취침 시간<input type="time" value={settings.dayEndsAt} onChange={e=>setSettings({...settings,dayEndsAt:e.target.value})}/></label><p className="record-muted">일정 계획 시간표와 홈 오늘의 일정에 함께 적용돼요.</p><button type="button" className="record-button" disabled={pending} onClick={()=>save(()=>updateMyPageSettings(settings),"하루 시간표 설정을 저장했어요.", () => setScheduleOpen(false))}>저장</button></div></CollapsibleBlock>
    <CollapsibleBlock title="메뉴 활성화 설정" open={menuOpen} onOpenChange={setMenuOpen}><div className="mypage-order-list">{order.map((key, index) => <div key={key}><label><input type="checkbox" checked={moduleValues[key] ?? false} onChange={(e) => setModuleValues({ ...moduleValues, [key]: e.target.checked })}/><span>{index + 1}. {labels[key] ?? key}</span></label><button type="button" aria-label={`${labels[key] ?? key} 위로`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`${labels[key] ?? key} 아래로`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>↓</button></div>)}</div><button type="button" className="record-button" disabled={pending} onClick={() => save(async () => { const moduleResult = await updateModulePreferences(moduleValues); if (!moduleResult.ok) return moduleResult; return updateNavigationOrder(order); }, "메뉴 활성화와 순서를 저장했어요.", () => setMenuOpen(false))}>저장</button></CollapsibleBlock>
    <CollapsibleBlock title="초기 성향 검사" open={personalityOpen} onOpenChange={setPersonalityOpen}><p className="record-muted">검사를 건너뛰었거나 다시 해보고 싶다면 여기서 시작할 수 있어요.</p><button type="button" className="record-button" disabled={pending} onClick={() => save(async () => { const result = await startPersonalityAssessment(); if (result.ok) router.push("/onboarding"); return result; }, "성향 검사로 이동할게요.")}>성향 검사 다시 하기</button></CollapsibleBlock>
    <CollapsibleBlock title="AI 분석 동의" open={aiOpen} onOpenChange={setAiOpen}><p className="record-muted">동의한 기록만 AI 분석에 사용됩니다. 언제든지 변경할 수 있어요.</p><div className="mypage-order-list">{[["module:diary","일기"],["module:routine","루틴"],["module:schedule","일정"],["module:exercise","운동"],["module:reading","독서"],["module:memo","메모"],["module:payroll","월급"],["module:investment","투자"],["module:project","프로젝트"],["personality_analysis","초기 성향 결과"]].map(([key,label]) => <label key={key}><input type="checkbox" checked={consents[key] === true} onChange={(e) => setConsents({ ...consents, [key]: e.target.checked })}/><span>{label} 분석</span></label>)}</div><button type="button" className="record-button" disabled={pending} onClick={() => save(() => updateAiConsents(consents), "AI 분석 동의를 저장했어요.", () => setAiOpen(false))}>저장</button></CollapsibleBlock>
  </div>;
}
