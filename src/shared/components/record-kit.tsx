"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function RecordPageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode; date?: string; onDateChange?: (date: string) => void }) {
  return <header className="rk-page-header"><div><p>{eyebrow}</p><h1>{title}</h1></div>{action}</header>;
}

export function RecordDateField({ value, onChange, label = "날짜" }: { value: string; onChange: (date: string) => void; label?: string }) {
  return <label className="rk-date-field">{label}<input aria-label={label} type="date" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function RecordSummaryStrip({ items }: { items: Array<{ id: string; label: string; value: string; suffix?: string }> }) {
  return <section aria-label="기록 요약" className="rk-summary-strip">{items.map((item) => <article key={item.id}><span>{item.label}</span><strong>{item.value}{item.suffix ? <small>{item.suffix}</small> : null}</strong></article>)}</section>;
}

export function ProgressRing({ completed, total, label = "완료율", showValue = false }: { completed: number; total: number; label?: string; showValue?: boolean }) {
  const safeCompleted = Math.max(0, Math.min(completed, total > 0 ? total : 0));
  const rate = total > 0 ? Math.round((safeCompleted / total) * 100) : 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - rate / 100);
  return <div className={`rk-progress-ring${showValue ? " has-value" : ""}`} role="img" aria-label={`${label} ${safeCompleted}/${total}, ${rate}%`}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle className="rk-progress-ring-track" cx="50" cy="50" r={radius} />
      <circle className="rk-progress-ring-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={dashOffset} />
    </svg>{showValue ? <strong aria-hidden="true">{rate}%</strong> : null}
  </div>;
}

export function CollapsibleRecordCard({ title, triggerContent, triggerActions, open, onOpenChange, children }: { title: string; triggerContent?: ReactNode; triggerActions?: ReactNode; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <section className={`rk-collapsible${open ? " is-open" : ""}`}><div className="rk-collapsible-header"><button aria-expanded={open} className="rk-collapsible-trigger" type="button" onClick={() => onOpenChange(!open)}>{triggerContent ?? <><span>{title}</span><span className="rk-plus" aria-hidden="true"><Plus size={18} /></span></>}</button>{triggerActions ? <div className="rk-collapsible-actions">{triggerActions}</div> : null}</div>{open ? <div className="rk-collapsible-body">{children}</div> : null}</section>;
}

export function RecordItem({ children }: { children: ReactNode }) { return <article className="rk-record-item">{children}</article>; }
export function InlineRecordEditor({ children }: { children: ReactNode }) { return <div className="rk-inline-editor">{children}</div>; }

type CalendarValue = { date: string; label: string; progress?: { completed: number; total: number } };
const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];

export function ActivityCalendar({ month, selectedDate, values, onDateSelect, onMonthChange, title = "월간 기록", maxDate, weekStartsOn = "monday", headerExtra }: { month: string; selectedDate: string; values: CalendarValue[]; onDateSelect: (date: string) => void; onMonthChange: (month: string) => void; title?: string; maxDate?: string; weekStartsOn?: "monday" | "sunday"; headerExtra?: ReactNode }) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText); const monthNumber = Number(monthText);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const leading = weekStartsOn === "sunday" ? firstWeekday : (firstWeekday + 6) % 7;
  const labels = weekStartsOn === "sunday" ? ["일", "월", "화", "수", "목", "금", "토"] : weekdayLabels;
  const isFuture = (value: string) => Boolean(maxDate && value > maxDate);
  const map = new Map(values.map((value) => [value.date, value]));
  const shift = (amount: number) => { const next = new Date(Date.UTC(year, monthNumber - 1 + amount, 1)); const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`; if (maxDate && nextMonth > maxDate.slice(0, 7)) return; onMonthChange(nextMonth); };
  return <section className="rk-calendar" aria-labelledby="rk-calendar-title"><div className="rk-calendar-heading"><div><p>MONTHLY VIEW</p><div className="rk-calendar-title-row"><h2 id="rk-calendar-title">{title}</h2>{headerExtra}</div></div><nav aria-label="달력 월 이동"><button aria-label="이전 달" type="button" onClick={() => shift(-1)}><ChevronLeft size={18} /></button><strong>{year}년 {monthNumber}월</strong><button aria-label="다음 달" type="button" disabled={Boolean(maxDate && month === maxDate.slice(0, 7))} onClick={() => shift(1)}><ChevronRight size={18} /></button></nav></div><div className="rk-calendar-grid" role="grid" aria-label={`${year}년 ${monthNumber}월`}>{labels.map((label) => <div className="rk-weekday" key={label} role="columnheader">{label}</div>)}{Array.from({ length: leading }, (_, index) => <div aria-hidden="true" className="rk-calendar-empty" key={`empty-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1; const date = `${month}-${String(day).padStart(2, "0")}`; const value = map.get(date); const label = value?.label; const future = isFuture(date); return <button aria-label={`${monthNumber}월 ${day}일${future ? " 선택할 수 없음" : label ? ` ${label}` : " 기록 없음"}`} disabled={future} className={`${selectedDate === date ? "is-selected " : ""}${future ? "is-future" : ""}`} key={date} role="gridcell" type="button" onClick={() => onDateSelect(date)}><span>{day}</span>{value?.progress ? <ProgressRing completed={value.progress.completed} total={value.progress.total} label="완료율" /> : label ? <strong>{label}</strong> : null}</button>; })}</div></section>;
}

