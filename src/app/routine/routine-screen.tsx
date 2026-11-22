"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { archiveRoutine, createRoutine, deleteDailyRoutineReflection, listArchivedRoutines, restoreRoutine, saveDailyRoutineReflection, toggleRoutineOccurrence, trashRoutine, updateRoutine } from "@/core/records/routine-actions";
import { ActivityCalendar, CollapsibleRecordCard, ProgressRing, RecordDateField, RecordItem, RecordPageHeader } from "@/shared/components/record-kit";
import { useToast } from "@/shared/components/toast-provider";
import { LIFE_AREAS, LIFE_AREA_LABELS, type LifeArea } from "@/core/life-balance";

type Routine = { id: string; title: string; period: string; weekdays: number[]; is_active: boolean; archived_at: string | null; life_area: string };
type Occurrence = { routine_id: string; status: string; occurrence_date: string };
type Reflection = { id: string; routine_id: string | null; reflection_date: string; content: string; deleted_at?: string | null };
type CalendarDay = { date: string; rate: number; completed: number; total: number; hasRoutine: boolean };
type ArchivedRoutine = Routine & { deleted_at?: string | null };
const periods = [["morning", "오전"], ["afternoon", "오후"], ["evening", "저녁"]] as const;
function initialOpenPeriods(date: string) { const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; if (date !== today) return []; const hour = now.getHours(); if (hour >= 7 && hour < 12) return ["morning"]; if (hour >= 12 && hour < 18) return ["afternoon"]; if (hour >= 18 && hour <= 23) return ["evening"]; return []; }

export function RoutineScreen({ date, weekStartsOn = "monday", initialRoutines, archivedRoutines = [], initialOccurrences, reflections, weekRate, monthRate, calendar }: { date: string; weekStartsOn?: "monday" | "sunday"; initialRoutines: Routine[]; archivedRoutines?: ArchivedRoutine[]; initialOccurrences: Occurrence[]; reflections: Reflection[]; weekRate: number; monthRate: number; calendar: CalendarDay[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [routines, setRoutines] = useState(initialRoutines);
  const [archived, setArchived] = useState(archivedRoutines);
  useEffect(() => { if (archived.length === 0) void listArchivedRoutines().then((result) => { if (result.ok && result.data) setArchived(result.data); }); }, [archived.length]);
  const [occurrences, setOccurrences] = useState(initialOccurrences);
  const [dailyContent, setDailyContent] = useState(reflections.find((item) => item.routine_id === null)?.content ?? "");
  const [dailySaved, setDailySaved] = useState(reflections.some((item) => item.routine_id === null));
  const [detailReflectionEditing, setDetailReflectionEditing] = useState(false);
  const [detailReflectionCreating, setDetailReflectionCreating] = useState(false);
  const [reflectionOriginal, setReflectionOriginal] = useState("");
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPeriod, setEditPeriod] = useState("morning");
  const [editLifeArea, setEditLifeArea] = useState<LifeArea>("health");
  const [editWeekdays, setEditWeekdays] = useState<number[]>([]);
  const [sortMode, setSortMode] = useState<"time" | "period">("period");
  const [openPeriods, setOpenPeriods] = useState<string[]>(() => initialOpenPeriods(date));
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("morning");
  const [lifeArea, setLifeArea] = useState<LifeArea>("health");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [pending, startTransition] = useTransition();
  void detailReflectionCreating;
  useEffect(() => {
    const selectedReflection = reflections.find((item) => item.routine_id === null && item.reflection_date === date && !item.deleted_at);
    setDailyContent(selectedReflection?.content ?? "");
    setDailySaved(Boolean(selectedReflection));
    setReflectionOriginal(selectedReflection?.content ?? "");
    setDetailReflectionEditing(false);
    setReflectionOpen(false);
    setEditingId(null);
  }, [date, reflections]);
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setReflectionOpen(true);
    requestAnimationFrame(() => document.querySelector(".routine-page .rk-collapsible")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [searchParams]);
  const go = (nextDate: string) => router.push(`/routine?date=${nextDate}`, { scroll: false });
  const saveReflection = () => startTransition(async () => {
    const result = await saveDailyRoutineReflection({ date, content: dailyContent });
    if (!result.ok) return showToast(result.error ?? "회고를 저장하지 못했어요.", "error");
    setDailySaved(true);
    setReflectionOriginal(dailyContent);
    setReflectionOpen(false);
    setDetailReflectionEditing(false);
    showToast("오늘의 루틴 회고를 저장했어요.", "success");
  });
  const removeReflection = () => startTransition(async () => {
    const result = await deleteDailyRoutineReflection(date);
    if (!result.ok) return showToast(result.error ?? "회고를 삭제하지 못했어요.", "error");
    setDailyContent("");
    setDailySaved(false);
    setReflectionOriginal("");
    setDetailReflectionEditing(false);
    showToast("회고를 삭제했어요.", "success");
  });
  const add = () => startTransition(async () => {
    const result = await createRoutine({ title, period, weekdays, lifeArea });
    if (!result.ok || !result.data) return showToast(result.error ?? "저장하지 못했어요.", "error");
    const created = result.data;
    setRoutines((current) => [...current, { id: created.id, title, period, weekdays, is_active: true, archived_at: null, life_area: lifeArea }]);
    setTitle(""); setLifeArea("health");
    setCreateOpen(false);
    showToast("루틴을 추가했어요.", "success");
  });
  const toggle = (routine: Routine) => startTransition(async () => {
    const done = occurrences.some((item) => item.routine_id === routine.id && item.status === "completed");
    const result = await toggleRoutineOccurrence(routine.id, date, !done);
    if (!result.ok) return showToast(result.error ?? "상태를 저장하지 못했어요.", "error");
    setOccurrences((current) => done ? current.filter((item) => item.routine_id !== routine.id) : [...current.filter((item) => item.routine_id !== routine.id), { routine_id: routine.id, status: "completed", occurrence_date: date }]);
    showToast(done ? "완료를 취소했어요." : "루틴을 완료했어요.", "success");
  });
  const archive = (id: string) => startTransition(async () => {
    const result = await archiveRoutine(id);
    if (!result.ok) return showToast(result.error ?? "보관하지 못했어요.", "error");
    const moved = routines.find((item) => item.id === id);
    setRoutines((current) => current.filter((item) => item.id !== id));
    if (moved) setArchived((current) => [{ ...moved, archived_at: new Date().toISOString() }, ...current]);
    showToast("루틴을 보관했어요.", "success");
  });
  const beginEdit = (routine: Routine) => { setEditingId(routine.id); setEditTitle(routine.title); setEditPeriod(routine.period); setEditWeekdays(routine.weekdays); setEditLifeArea((LIFE_AREAS.find(area => area === routine.life_area) ?? "health")); };
  const saveEdit = (id: string) => startTransition(async () => {
    const result = await updateRoutine(id, { title: editTitle, period: editPeriod, weekdays: editWeekdays, lifeArea: editLifeArea });
    if (!result.ok) return showToast(result.error ?? "루틴을 수정하지 못했어요.", "error");
    setRoutines((current) => current.map((item) => item.id === id ? { ...item, title: editTitle, period: editPeriod, weekdays: editWeekdays, life_area: editLifeArea } : item));
    setEditingId(null);
    showToast("루틴을 수정했어요.", "success");
  });
  const restore = (routine: ArchivedRoutine) => startTransition(async () => {
    const result = await restoreRoutine(routine.id);
    if (!result.ok) return showToast(result.error ?? "루틴을 복원하지 못했어요.", "error");
    setArchived((current) => current.filter((item) => item.id !== routine.id));
    setRoutines((current) => [...current, { ...routine, is_active: true, archived_at: null }]);
    showToast("루틴을 다시 활성화했어요.", "success");
  });
  const remove = (routine: Routine) => startTransition(async () => {
    const result = await trashRoutine(routine.id);
    if (!result.ok) return showToast(result.error ?? "휴지통으로 이동하지 못했어요.", "error");
    setRoutines((current) => current.filter((item) => item.id !== routine.id));
    showToast("루틴을 휴지통으로 이동했어요.", "success");
  });
  const calendarValues = calendar.map((day) => ({ date: day.date, label: day.rate + "%", progress: { completed: day.completed, total: day.total } }));
  const dateWeekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const dailyRoutines = routines.filter((routine) => routine.is_active && routine.weekdays.includes(dateWeekday));
  const todayCompleted = dailyRoutines.filter((routine) => occurrences.some((item) => item.routine_id === routine.id && item.status === "completed")).length;
  const sortedRoutines = [...routines].sort((a, b) => sortMode === "period" ? a.period.localeCompare(b.period) : a.title.localeCompare(b.title, "ko"));
  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const weekdayOrder = weekStartsOn === "sunday" ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];

  return <div className="rk-page routine-page">
    <RecordPageHeader eyebrow="기록 ・ 습관" title="오늘의 루틴" date={date} onDateChange={go} />
    <section className="routine-summary" aria-label="루틴 통계"><article className="routine-summary-main"><span>오늘의 루틴 진행률</span><ProgressRing completed={todayCompleted} total={dailyRoutines.length} label="오늘의 루틴 진행률" showValue /></article><article><span>이번 달 완료율</span><strong>{monthRate}%</strong></article><article><span>이번 주 완료율</span><strong>{weekRate}%</strong></article></section>
    <CollapsibleRecordCard title="오늘의 루틴 회고" open={reflectionOpen} onOpenChange={setReflectionOpen}>
      <div className="rk-form">
        <RecordDateField value={date} onChange={go} />
        <label>오늘의 루틴 회고<textarea value={dailyContent} onChange={(event) => setDailyContent(event.target.value)} placeholder="오늘의 루틴 회고를 적어보세요." /></label><div className="rk-actions"><button className="rk-button primary" type="button" disabled={pending} onClick={saveReflection}>저장</button></div>
      </div>
    </CollapsibleRecordCard>
    <section className="routine-management"><h2 className="rk-section-title">루틴 관리</h2><CollapsibleRecordCard title="새 루틴 추가" open={createOpen} onOpenChange={setCreateOpen}>
      <form className="rk-form" onSubmit={(event) => { event.preventDefault(); add(); }}><label>루틴 이름<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 아침 산책" /></label><label>시간대<select value={period} onChange={(event) => setPeriod(event.target.value)}>{periods.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>삶 영역 (기본: 건강)<select value={lifeArea} onChange={event => setLifeArea(event.target.value as LifeArea)}>{LIFE_AREAS.map(area => <option key={area} value={area}>{LIFE_AREA_LABELS[area]}</option>)}</select></label><fieldset className="rk-weekdays"><legend>반복 요일</legend>{weekdayOrder.map((index) => <button className={`rk-button ${weekdays.includes(index) ? "primary" : "secondary"}`} key={index} type="button" onClick={() => setWeekdays((current) => current.includes(index) ? current.filter((day) => day !== index) : [...current, index])}>{weekdayLabels[index]}</button>)}</fieldset><button className="rk-button primary" disabled={!title.trim() || pending} type="submit">저장</button></form>
    </CollapsibleRecordCard><CollapsibleRecordCard title="보관된 루틴" open={archiveOpen} onOpenChange={setArchiveOpen}>{archived.length === 0 ? <p className="rk-empty">보관된 루틴이 없어요.</p> : archived.map((routine) => <RecordItem key={routine.id}><div className="routine-item-row"><span>{routine.title}<small className="routine-meta"> · {weekdayOrder.filter((day) => routine.weekdays.includes(day)).map((day) => weekdayLabels[day]).join("")} · {routine.archived_at?.slice(0, 10) ?? "보관됨"}</small></span><div className="rk-actions"><button className="rk-button secondary" type="button" onClick={() => restore(routine)}>다시 활성화</button><button className="rk-button danger" type="button" onClick={() => remove(routine)}>휴지통</button></div></div></RecordItem>)}</CollapsibleRecordCard><CollapsibleRecordCard title="전체 루틴 관리" open={managementOpen} onOpenChange={setManagementOpen}>{periods.map(([key, label]) => <div className="routine-management-group" key={key}><h3>{label}</h3>{routines.filter((routine) => routine.period === key).map((routine) => <RecordItem key={routine.id}><div className="routine-item-row"><span>{routine.title}<small className="routine-meta"> · {weekdayOrder.filter((day) => routine.weekdays.includes(day)).map((day) => weekdayLabels[day]).join("")}</small><small className="routine-status">활성</small></span><div className="rk-actions"><button className="rk-button secondary" type="button" onClick={() => beginEdit(routine)}>수정</button><button className="rk-button secondary" type="button" onClick={() => archive(routine.id)}>보관</button></div></div>{editingId === routine.id ? <div className="rk-inline-editor"><form className="rk-form" onSubmit={(event) => { event.preventDefault(); saveEdit(routine.id); }}><label>제목<input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label><label>시간대<select value={editPeriod} onChange={(event) => setEditPeriod(event.target.value)}>{periods.map(([periodKey, periodLabel]) => <option key={periodKey} value={periodKey}>{periodLabel}</option>)}</select></label><label>삶 영역<select value={editLifeArea} onChange={event => setEditLifeArea(event.target.value as LifeArea)}>{LIFE_AREAS.map(area => <option key={area} value={area}>{LIFE_AREA_LABELS[area]}</option>)}</select></label><div className="rk-actions"><button className="rk-button primary" type="submit">수정 완료</button><button className="rk-button secondary" type="button" onClick={() => setEditingId(null)}>취소</button></div></form></div> : null}</RecordItem>)}</div>)}</CollapsibleRecordCard></section>
    <section className="routine-execution"><div className="routine-execution-heading"><h2 className="rk-section-title">오늘의 루틴</h2><select aria-label="루틴 정렬" value={sortMode} onChange={(event) => setSortMode(event.target.value as "time" | "period")}><option value="period">시간대순</option><option value="time">시간순</option></select></div><section className="rk-list routine-groups" aria-label="시간대별 루틴">{periods.map(([key, label]) => <CollapsibleRecordCard key={key} title={`${label} 루틴 · ${sortedRoutines.filter((routine) => routine.period === key && routine.is_active && occurrences.some((item) => item.routine_id === routine.id && item.status === "completed")).length}/${sortedRoutines.filter((routine) => routine.period === key && routine.is_active).length}`} open={openPeriods.includes(key)} onOpenChange={(nextOpen) => setOpenPeriods((current) => nextOpen ? [...new Set([...current, key])] : current.filter((item) => item !== key))}>{sortedRoutines.filter((routine) => routine.period === key && routine.is_active).map((routine) => { const done = occurrences.some((item) => item.routine_id === routine.id && item.status === "completed"); return <RecordItem key={routine.id}><div className={`routine-item-row${done ? " is-complete" : ""}`}><label className="routine-check"><input type="checkbox" checked={done} onChange={() => toggle(routine)} /><span>{routine.title}<small className="routine-meta"> · {label}</small></span></label><div className="rk-actions"><button className="rk-button secondary" type="button" onClick={() => beginEdit(routine)}>수정</button><button className="rk-button secondary" type="button" onClick={() => archive(routine.id)}>보관</button></div></div></RecordItem>; })}</CollapsibleRecordCard>)}</section></section>
    <ActivityCalendar month={date.slice(0, 7)} selectedDate={date} values={calendarValues} onDateSelect={go} onMonthChange={(nextMonth) => go(`${nextMonth}-01`)} title="루틴 기록" />
    <section className="rk-list routine-detail" aria-label={`${date} 루틴 상세`}><h2 className="rk-detail-title">{date} 루틴 상세</h2><p className="routine-detail-rate">완료율 {dailyRoutines.length ? Math.round(todayCompleted / dailyRoutines.length * 100) : 0}%</p><div className="routine-reflection-detail"><h3>루틴 회고</h3>{dailySaved ? <><p className="rk-original-text">{dailyContent}</p>{detailReflectionEditing ? <div className="rk-inline-editor"><textarea value={dailyContent} onChange={(event) => setDailyContent(event.target.value)} /><div className="rk-actions"><button className="rk-button primary" type="button" disabled={pending} onClick={saveReflection}>수정 완료</button><button className="rk-button secondary" type="button" onClick={() => { setDailyContent(reflectionOriginal); setDetailReflectionEditing(false); setDetailReflectionCreating(false); }}>취소</button></div></div> : <div className="rk-actions"><button className="rk-button secondary" type="button" onClick={() => { setReflectionOpen(false); setReflectionOriginal(dailyContent); setDetailReflectionEditing(true); setDetailReflectionCreating(false); }}>수정</button><button className="rk-button danger" type="button" disabled={pending} onClick={removeReflection}>삭제</button></div>}</> : <><p className="rk-empty">작성된 루틴 회고가 없어요.</p>{detailReflectionEditing ? <div className="rk-inline-editor"><textarea value={dailyContent} onChange={(event) => setDailyContent(event.target.value)} placeholder="오늘의 루틴 회고를 적어보세요." /><div className="rk-actions"><button className="rk-button primary" type="button" disabled={pending} onClick={saveReflection}>저장</button><button className="rk-button secondary" type="button" onClick={() => { setDailyContent(""); setDetailReflectionEditing(false); setDetailReflectionCreating(false); }}>취소</button></div></div> : <button className="rk-button secondary" type="button" onClick={() => { setReflectionOpen(false); setDailyContent(""); setDetailReflectionCreating(true); setDetailReflectionEditing(true); }}>회고 작성</button>}</>}</div><details open><summary>완료한 루틴</summary>{dailyRoutines.filter((routine) => occurrences.some((item) => item.routine_id === routine.id && item.status === "completed")).map((routine) => <label className="rk-detail-row routine-detail-check" key={routine.id}><input type="checkbox" checked onChange={() => toggle(routine)} /><span>{routine.title}</span></label>)}{dailyRoutines.filter((routine) => occurrences.some((item) => item.routine_id === routine.id && item.status === "completed")).length === 0 ? <p className="rk-empty">완료한 루틴이 없어요.</p> : null}</details><details open><summary>미완료 루틴</summary>{dailyRoutines.filter((routine) => !occurrences.some((item) => item.routine_id === routine.id && item.status === "completed")).map((routine) => <label className="rk-detail-row routine-detail-check" key={routine.id}><input type="checkbox" checked={false} onChange={() => toggle(routine)} /><span>{routine.title}</span></label>)}{dailyRoutines.filter((routine) => !occurrences.some((item) => item.routine_id === routine.id && item.status === "completed")).length === 0 ? <p className="rk-empty">미완료 루틴이 없어요.</p> : null}</details></section>
  </div>;
}
