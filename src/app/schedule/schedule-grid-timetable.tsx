"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePlan, savePlan } from "@/core/schedule-actions";
import { useToast } from "@/shared/components/toast-provider";

type Todo = { id: string; title: string };
type Plan = { id: string; todo_id: string; starts_at: string; ends_at: string; todos: { id: string; title: string } | null };
type GoogleEvent = { id: string; title: string; allDay: boolean; startTime: string | null; endTime: string | null };
type Entry = { id: string; title: string; start: number; end: number; kind: "priority" | "todo" | "google" | "sleep" };
type Segment = { entry: Entry; start: number; end: number; column: number };

export const SCHEDULE_GRID_COLORS = { priority: "#FFE3B3", google: "#8EBBF0", todo: "#DCCCF4", sleep: "#DFD5CE" } as const;
export const parseClockMinutes = (value: string | null, fallback = 0) => {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
};
const hour = (value: string | null, fallback = 0) => {
  if (!value) return fallback;
  const minutes = parseClockMinutes(value, -1);
  if (minutes >= 0) return minutes / 60;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.getHours() + date.getMinutes() / 60;
};
const time = (value: string | null) => value ? new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
const planTime = (value: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
const columnFor = (hourValue: number) => hourValue >= 6 && hourValue < 12 ? 0 : hourValue >= 12 && hourValue < 18 ? 1 : hourValue >= 18 ? 2 : 3;
const rowFor = (hourValue: number, column: number) => Math.floor(column === 0 ? hourValue - 6 : column === 1 ? hourValue - 12 : column === 2 ? hourValue - 18 : hourValue);

export const splitScheduleEntry = (entry: Entry): Segment[] => {
  const start = Number.isFinite(entry.start) ? entry.start : 0;
  const rawEnd = Number.isFinite(entry.end) ? entry.end : start;
  const end = rawEnd <= start ? rawEnd + 24 : rawEnd;
  if (end <= start || end - start > 24) return [];
  const result: Segment[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor < end && guard < 4) {
    const visibleHour = ((cursor % 24) + 24) % 24;
    const column = Math.floor(visibleHour / 8);
    const dayStart = Math.floor(cursor / 24) * 24;
    const columnEnd = dayStart + (column + 1) * 8;
    const next = Math.min(end, columnEnd);
    if (next <= cursor) break;
    const localStart = visibleHour % 8;
    result.push({ entry, start: localStart, end: Math.min(8, localStart + next - cursor), column });
    cursor = next;
    guard += 1;
  }
  return result;
};

const columns = [["오전", 0], ["오후", 8], ["저녁", 16]] as const;

export function ScheduleGridTimeTable({ date, todos, plans, googleEvents, priorityTodoIds = [], dayStart = "07:00", dayEnd = "23:00" }: { date: string; todos: Todo[]; plans: Plan[]; googleEvents: GoogleEvent[]; priorityTodoIds?: string[]; dayStart?: string; dayEnd?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, start] = useTransition();
  const [todoId, setTodoId] = useState(todos[0]?.id ?? "");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [editing, setEditing] = useState<string | null>(null);
  const prioritySet = new Set(priorityTodoIds);
  const entries: Entry[] = [
    ...plans.map(plan => ({ id: plan.id, title: plan.todos?.title ?? "TODO", start: hour(plan.starts_at, 9), end: hour(plan.ends_at, 10), kind: prioritySet.has(plan.todo_id) ? "priority" as const : "todo" as const })),
    ...googleEvents.filter(event => !event.allDay && event.startTime && event.endTime).map(event => ({ id: event.id, title: event.title, start: hour(event.startTime, 9), end: hour(event.endTime, 10), kind: "google" as const })),
  ];
  const segments = entries.flatMap(splitScheduleEntry);
  const submit = () => start(async () => { const result = await savePlan({ todoId, planDate: date, startsAt: new Date(`${date}T${startTime}:00+09:00`).toISOString(), endsAt: new Date(`${date}T${endTime}:00+09:00`).toISOString() }); showToast(result.ok ? (editing ? "시간표를 수정했어요." : "시간표에 저장했어요.") : result.error ?? "저장하지 못했어요.", result.ok ? "success" : "error"); if (result.ok) { setEditing(null); router.refresh(); } });
  const edit = (plan: Plan) => { setEditing(plan.id); setTodoId(plan.todo_id); setStartTime(planTime(plan.starts_at)); setEndTime(planTime(plan.ends_at)); };
  const remove = (id: string) => start(async () => { const result = await deletePlan(id); showToast(result.ok ? "시간표 배치를 해제했어요." : result.error ?? "배치를 해제하지 못했어요.", result.ok ? "success" : "error"); if (result.ok) router.refresh(); });
  const renderBlock = (segment: Segment, index: number, columnSegments: Segment[]) => { const plan = plans.find(item => item.id === segment.entry.id); const sameEntry = columnSegments.filter(item => item.entry.id === segment.entry.id); const widest = sameEntry.reduce((best, item) => item.end - item.start > best.end - best.start ? item : best, sameEntry[0]); const title = widest === segment ? segment.entry.title : ""; const overlaps = columnSegments.filter(item => item !== segment && item.start < segment.end && item.end > segment.start); const lane = overlaps.filter(item => item.entry.id < segment.entry.id).length; const laneCount = Math.max(1, overlaps.length + 1); return <button type="button" key={`${segment.entry.id}-${segment.column}-${segment.start}-${index}`} className={`schedule-grid-block${editing === segment.entry.id ? " is-editing" : ""}`} style={{ background: SCHEDULE_GRID_COLORS[segment.entry.kind], top: `${segment.start / 8 * 100}%`, height: `${(segment.end - segment.start) / 8 * 100}%`, left: `${lane / laneCount * 100}%`, width: `${100 / laneCount}%` }} title={`${segment.entry.title}${segment.entry.kind === "google" ? ` · ${time(googleEvents.find(event => event.id === segment.entry.id)?.startTime ?? null)}` : ""}`} aria-label={`${segment.entry.title} 일정 수정`} onClick={() => plan && edit(plan)}>{title}</button>; };
  return <section className="day-timetable schedule-grid-timetable"><div className="timetable-heading"><h2 className="rk-section-title">하루 시간표</h2><div className="clock-legend timetable-heading-legend"><span><i className="priority-dot" /> 우선순위</span><span><i className="todo-dot" /> TODO</span><span><i className="google-dot" /> Google</span></div></div><div className="schedule-grid" aria-label="24시간 표형 시간표"><div className="schedule-grid-header">{columns.map(([label]) => <strong key={label}>{label}</strong>)}</div><div className="schedule-grid-body">{columns.map(([label, startHour], column) => { const columnSegments = segments.filter(segment => segment.column === column); return <div className="schedule-grid-column" key={label}>{Array.from({ length: 8 }, (_, row) => <div className="schedule-grid-cell" key={`${label}-${startHour + row}`}><small>{startHour + row}</small></div>)}<div className="schedule-grid-overlay">{columnSegments.map((segment, index) => renderBlock(segment, index, columnSegments))}</div></div>; })}</div></div><div className="timetable-controls"><div className="schedule-plan-form"><select value={todoId} onChange={event => setTodoId(event.target.value)} aria-label="시간표에 배치할 TODO"><option value="">TODO 선택</option>{todos.map(todo => <option key={todo.id} value={todo.id}>{todo.title}</option>)}</select><input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} aria-label="시작 시간" /><input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} aria-label="종료 시간" /><button className="rk-button primary" disabled={pending || !todoId} onClick={submit}>{editing ? "수정 저장" : "배치"}</button>{editing ? <button className="rk-button secondary" type="button" onClick={() => setEditing(null)}>취소</button> : null}</div></div></section>;
}
