"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlan, savePlan } from "@/core/schedule-actions";
import { useToast } from "@/shared/components/toast-provider";
import { createSupabaseBrowserClient } from "@/core/supabase/browser";
import { layoutLabel, sectorPath, textColorFor } from "./clock-labels";

type Todo = { id: string; title: string };
type Plan = { id: string; todo_id: string; starts_at: string; ends_at: string; todos: { id: string; title: string } | null };
type GoogleEvent = { id: string; title: string; allDay: boolean; startTime: string | null; endTime: string | null };

const SIZE = 322;
const CENTER = SIZE / 2;
const RADIUS = 113;
const rounded = (value: number) => Number(value.toFixed(3));
const safeHour = (value: number, fallback = 12) => Number.isFinite(value) ? ((value % 24) + 24) % 24 : fallback;
const point = (hour: number, radius = RADIUS) => {
  hour = safeHour(hour);
  const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
  return { x: rounded(CENTER + Math.cos(angle) * radius), y: rounded(CENTER + Math.sin(angle) * radius) };
};
const hourOf = (value: string | null, fallback: number) => { if (!value) return fallback; const date = new Date(value); const hour = date.getHours() + date.getMinutes() / 60; return Number.isFinite(hour) ? hour : fallback; };
const timeLabel = (value: string | null) => value ? new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";

export function TimeTable({ date, todos, plans, googleEvents, compact = false, title = "하루 시간표", priorityTodoIds = [], showCurrentTime = false, currentHour = 12, timeZone = "Asia/Seoul", dayStart = "07:00", dayEnd = "23:00" }: { date: string; todos: Todo[]; plans: Plan[]; googleEvents: GoogleEvent[]; compact?: boolean; title?: string; priorityTodoIds?: string[]; showCurrentTime?: boolean; currentHour?: number; timeZone?: string; dayStart?: string; dayEnd?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, start] = useTransition();
  const [todoId, setTodoId] = useState(todos[0]?.id ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [liveHour, setLiveHour] = useState(safeHour(currentHour));
  const [configuredDayStart, setConfiguredDayStart] = useState(dayStart);
  const [configuredDayEnd, setConfiguredDayEnd] = useState(dayEnd);
  useEffect(() => { const client = createSupabaseBrowserClient(); void client.from("profiles").select("day_starts_at,day_ends_at").maybeSingle().then(({ data }) => { if (data?.day_starts_at) setConfiguredDayStart(data.day_starts_at); if (data?.day_ends_at) setConfiguredDayEnd(data.day_ends_at); }); }, []);
  useEffect(() => {
    if (!showCurrentTime) return;
    const update = () => { const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()); const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0); const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0); setLiveHour(safeHour(hour + minute / 60)); };
    update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer);
  }, [showCurrentTime, timeZone]);

  const submit = () => start(async () => {
    const result = await savePlan({ todoId, planDate: date, startsAt: new Date(`${date}T${startTime}:00+09:00`).toISOString(), endsAt: new Date(`${date}T${endTime}:00+09:00`).toISOString() });
    showToast(result.ok ? (editingPlanId ? "시간표를 수정했어요." : "시간표에 저장했어요.") : result.error ?? "시간표에 저장하지 못했어요.", result.ok ? "success" : "error");
    if (result.ok) { setEditingPlanId(null); router.refresh(); }
  });
  const edit = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setTodoId(plan.todo_id);
    setStartTime(new Date(plan.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }));
    setEndTime(new Date(plan.ends_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }));
  };
  const cancelEdit = () => { setEditingPlanId(null); setStartTime("09:00"); setEndTime("10:00"); };
  const remove = (id: string) => start(async () => {
    const result = await deletePlan(id);
    showToast(result.ok ? "시간표 배치를 해제했어요." : result.error ?? "배치를 해제하지 못했어요.", result.ok ? "success" : "error");
    if (result.ok) router.refresh();
  });
  const prioritySet = new Set(priorityTodoIds);
  const plannedTodoIds = new Set(plans.map((plan) => plan.todo_id));
  const unplannedPriorities = priorityTodoIds.map((id) => todos.find((todo) => todo.id === id)).filter((todo): todo is Todo => todo !== undefined && !plannedTodoIds.has(todo.id));
  const scheduled = plans.map(plan => ({ id: plan.id, title: plan.todos?.title ?? "TODO", start: hourOf(plan.starts_at, 9), end: hourOf(plan.ends_at, 10), kind: prioritySet.has(plan.todo_id) ? "priority" as const : "todo" as const, startText: timeLabel(plan.starts_at), endText: timeLabel(plan.ends_at) }));
  const calendar = googleEvents.filter(event => !event.allDay && event.startTime && event.endTime).map(event => ({ id: event.id, title: event.title, start: hourOf(event.startTime, 9), end: hourOf(event.endTime, 10), kind: "google" as const, startText: timeLabel(event.startTime), endText: timeLabel(event.endTime) }));
  const entries = [...scheduled, ...calendar];
  const sleepEntry = { id: "sleep", title: "숙면", start: Number(configuredDayEnd.slice(0, 2)) + Number(configuredDayEnd.slice(3, 5)) / 60, end: Number(configuredDayStart.slice(0, 2)) + Number(configuredDayStart.slice(3, 5)) / 60, kind: "sleep" as const, startText: configuredDayEnd, endText: configuredDayStart };
  const visualEntries = [sleepEntry, ...entries];
  const safeLiveHour = safeHour(liveHour);
  const displayRadius = compact ? 142 : RADIUS;
  const isActive = (entry: (typeof sleepEntry) | (typeof entries)[number], hour: number) =>
    entry.kind === "sleep" && entry.start > entry.end
      ? hour >= entry.start || hour < entry.end
      : entry.start <= hour && entry.end > hour;
  const currentEntry = entries.find((entry) => isActive(entry, safeLiveHour))
    ?? (isActive(sleepEntry, safeLiveHour) ? sleepEntry : undefined);
  const nextEntry = [...entries].filter((entry) => entry.start > safeLiveHour).sort((a, b) => a.start - b.start)[0];
  const fillColor = (kind: string) => ({ priority: "#FFE3B3", todo: "#DCCCF4", google: "#8EBBF0", sleep: "#DFD5CE" }[kind] ?? "#E8E5E3");
  return <section className={`day-timetable${compact ? " compact-timetable" : ""}`}>
    <div className="timetable-heading"><h2 className="rk-section-title">{title}</h2>{!compact ? <div className="clock-legend timetable-heading-legend"><span><i className="priority-dot" /> 우선순위</span><span><i className="todo-dot" /> TODO</span><span><i className="google-dot" /> Google</span></div> : null}</div>
    <div className="timetable-layout">
      <div className="clock-wrap" aria-label="0시부터 24시까지의 하루 시간표">
        <svg className="day-clock" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img">
          <circle cx={CENTER} cy={CENTER} r={displayRadius} className="clock-track" />
          {Array.from({ length: 24 }, (_, hour) => { const p = point(hour, displayRadius + (compact ? 10 : 13)); return <text key={hour} x={p.x} y={p.y} className="clock-hour" textAnchor="middle" dominantBaseline="middle">{hour}</text>; })}
          {visualEntries.map((entry) => <path key={`${entry.kind}:${entry.id}`} d={sectorPath(entry.start, entry.end, displayRadius)} className={`clock-segment clock-sector ${entry.kind}`} />)}
          <g className="clock-labels" aria-label="일정 이름">
            {visualEntries.map((entry) => { const L = layoutLabel(entry.title, entry.start, entry.end, { radius: displayRadius, center: CENTER, baseFont: compact ? 14 : 16, radialFont: compact ? 14 : 16 }); const color = textColorFor(fillColor(entry.kind)); if (L.mode === "dot") return <g key={`label:${entry.kind}:${entry.id}`} className={`clock-entry-label ${entry.kind}`} pointerEvents="auto"><title>{L.fullLabel}</title><circle cx={L.x} cy={L.y} r={3} fill={color} /></g>; const fontSize = entry.kind === "sleep" ? (compact ? 16 : 17) : L.fontSize; const lineHeight = fontSize * (L.lineHeight ?? 1.15); const firstY = L.y - ((L.lines.length - 1) * lineHeight) / 2; return <text key={`label:${entry.kind}:${entry.id}`} x={L.x} y={firstY} className={`clock-entry-label ${entry.kind} ${L.mode}`} fill={color} fontSize={fontSize} fontWeight={600} textAnchor="middle" dominantBaseline="middle" pointerEvents="none" transform={L.mode === "radial" ? `rotate(${rounded(L.rotate)} ${L.x} ${L.y})` : undefined}>{L.lines.map((line, index) => <tspan key={`${entry.kind}:${entry.id}:${index}`} x={L.x} y={firstY + index * lineHeight}>{line}</tspan>)}</text>; })}
          </g>
          {showCurrentTime ? (() => { const currentPoint = point(safeLiveHour, displayRadius - 2); return <><circle cx={CENTER} cy={CENTER} r={displayRadius} className="clock-now-ring" /><line x1={CENTER} y1={CENTER} x2={currentPoint.x} y2={currentPoint.y} className="clock-now-line" /><circle cx={currentPoint.x} cy={currentPoint.y} r="2.5" className="clock-now-dot" /></>; })() : null}
          {!compact ? <><circle cx={CENTER} cy={CENTER} r={34} className="clock-center" /><text x={CENTER} y={CENTER - 4} className="clock-center-title" textAnchor="middle">{date.slice(5).replace("-", ".")}</text><text x={CENTER} y={CENTER + 14} className="clock-center-subtitle" textAnchor="middle">{entries.length ? `${entries.length}개 일정` : "비어 있음"}</text></> : null}
        </svg>
        {false ? <div className="clock-legend"><span><i className="priority-dot" /> 우선순위</span><span><i className="todo-dot" /> TODO</span><span><i className="google-dot" /> Google</span></div> : null}
      </div>
      <div className="timetable-controls">
        {!compact ? <div className="schedule-plan-form">
          <select value={todoId} onChange={event => setTodoId(event.target.value)} aria-label="시간표에 배치할 TODO"><option value="">TODO 선택</option>{todos.map(todo => <option key={todo.id} value={todo.id}>{todo.title}</option>)}</select>
          <input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} aria-label="시작 시간" />
          <input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} aria-label="종료 시간" />
          <button className="rk-button primary" disabled={pending || !todoId} onClick={submit}>{editingPlanId ? "수정 저장" : "배치"}</button>
          {editingPlanId ? <button className="rk-button secondary" type="button" onClick={cancelEdit}>취소</button> : null}
        </div> : null}
        {!compact && googleEvents.some(event => event.allDay) ? <div className="all-day-events"><strong>종일 일정</strong>{googleEvents.filter(event => event.allDay).map(event => <span key={event.id}>{event.title}</span>)}</div> : null}
        <div className="timeline-list">{compact ? <>{currentEntry ? <p className={`home-schedule-status has-event ${currentEntry.kind}`}>현재 일정 · <strong>{currentEntry.title}</strong></p> : null}{nextEntry ? <p className={`home-schedule-status has-event ${nextEntry.kind}`}>다음 일정 · <strong>{nextEntry.title}</strong> · {nextEntry.startText}</p> : null}</> : <><p className="record-muted">시간순 일정</p>{entries.length ? [...entries].sort((a, b) => a.start - b.start).map(entry => <article key={`${entry.kind}:${entry.id}`} className={`timeline-entry ${entry.kind}`}><div><strong>{entry.title}</strong><span>{entry.startText}–{entry.endText}</span></div>{entry.kind === "todo" || entry.kind === "priority" ? <div className="record-actions"><a className="rk-button secondary" href={`/schedule/timer?todo=${plans.find(plan => plan.id === entry.id)?.todo_id ?? ""}&plan=${entry.id}&date=${date}`}>타이머</a>{!compact && entry.kind === "todo" ? <><button className="rk-button secondary" onClick={() => edit(plans.find(plan => plan.id === entry.id)!)}>시간 수정</button><button className="rk-button secondary" onClick={() => remove(entry.id)}>배치 해제</button></> : null}</div> : null}</article>) : <p className="rk-empty">등록된 일정이 없어요.</p>}</>}</div>
        {compact ? null : unplannedPriorities.length ? <div className="home-unscheduled-priority"><h3>시간 미지정 우선순위</h3>{unplannedPriorities.map((todo) => <span key={todo.id}><b>{priorityTodoIds.indexOf(todo.id) + 1}</b>{todo.title}</span>)}</div> : null}
      </div>
    </div>
    {!compact ? <p className="sleep-notice">수면 설정 없음 · 마이페이지에서 수면 시간을 설정하면 별도 구간으로 표시됩니다. 수면 시간은 실행 기록에 합산하지 않아요.</p> : null}
  </section>;
}
