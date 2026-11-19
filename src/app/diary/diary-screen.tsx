"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { createDiary, trashDiary, updateDiary } from "@/core/records/diary-actions";
import { average, representativeEmotion } from "@/core/records/record-stats";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { ActivityCalendar, CollapsibleRecordCard, InlineRecordEditor, RecordDateField, RecordItem, RecordPageHeader, RecordSummaryStrip } from "@/shared/components/record-kit";
import { useToast } from "@/shared/components/toast-provider";

type Entry = { id: string; entry_date: string; title: string; emotion_emoji: string; emotion_score: number; content: string; created_at: string };
type MonthEntry = { id: string; entry_date: string; emotion_emoji: string; emotion_score: number };
type FormState = { title: string; emoji: string; score: number; content: string };
const emptyForm: FormState = { title: "", emoji: "🙂", score: 4, content: "" };
const emotions = [["😄", 5], ["🙂", 4], ["😐", 3], ["😟", 2], ["😞", 1]] as const;

function DiaryFields({ value, onChange }: { value: FormState; onChange: (value: FormState) => void }) {
  return <><label>제목<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="오늘을 한마디로 표현한다면" /></label><fieldset className="rk-emotions"><legend>감정</legend>{emotions.map(([emoji, score]) => <button aria-pressed={value.score === score} className={value.score === score ? "is-selected" : ""} key={score} type="button" onClick={() => onChange({ ...value, emoji, score })}>{emoji}<span>{score}점</span></button>)}</fieldset><label>오늘의 기록<textarea value={value.content} onChange={(event) => onChange({ ...value, content: event.target.value })} placeholder="오늘 있었던 일과 마음을 편하게 적어보세요." /></label></>;
}

export function DiaryScreen({ date, initialEntries, initialMonthEntries }: { date: string; initialEntries: Entry[]; initialMonthEntries: MonthEntry[] }) {
  const router = useRouter(); const searchParams = useSearchParams(); const { showToast } = useToast();
  const [entries, setEntries] = useState(initialEntries); const [monthEntries, setMonthEntries] = useState(initialMonthEntries);
  const [createOpen, setCreateOpen] = useState(false); const [createDate, setCreateDate] = useState(date); const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null); const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null); const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setCreateOpen(true);
    requestAnimationFrame(() => document.getElementById("diary-create")?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [searchParams]);
  useEffect(() => { setEntries(initialEntries); setEditingId(null); setCreateDate(date); }, [date, initialEntries]);
  const month = date.slice(0, 7);
  const weekRange = useMemo(() => { const selected = new Date(`${date}T00:00:00Z`); const start = new Date(selected); start.setUTCDate(selected.getUTCDate() - ((selected.getUTCDay() + 6) % 7)); const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6); return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]; }, [date]);
  const weekAverage = average(monthEntries.filter((entry) => entry.entry_date >= weekRange[0] && entry.entry_date <= weekRange[1]).map((entry) => entry.emotion_score));
  const monthAverage = average(monthEntries.map((entry) => entry.emotion_score));
  const recordedDays = new Set(monthEntries.map((entry) => entry.entry_date)).size;
  const calendarValues = Object.values(monthEntries.reduce<Record<string, MonthEntry[]>>((result, entry) => ({ ...result, [entry.entry_date]: [...(result[entry.entry_date] ?? []), entry] }), {})).map((items) => ({ date: items[0].entry_date, label: representativeEmotion(items) ?? items[0].emotion_emoji }));
  const navigateDate = (nextDate: string) => { setEditingId(null); router.push(`/diary?date=${nextDate}`, { scroll: false }); };
  const visibleEntries = entries.filter((entry) => entry.entry_date.slice(0, 10) === date).sort((a, b) => b.created_at.localeCompare(a.created_at));

  const create = () => startTransition(async () => { const result = await createDiary({ entryDate: createDate, title: createForm.title, emotionEmoji: createForm.emoji, emotionScore: createForm.score, content: createForm.content }); if (!result.ok || !result.data) return showToast(result.error ?? "저장하지 못했어요.", "error"); const entry = { id: result.data.id, entry_date: createDate, title: createForm.title, emotion_emoji: createForm.emoji, emotion_score: createForm.score, content: createForm.content, created_at: new Date().toISOString() }; if (createDate === date) setEntries((current) => [entry, ...current]); setMonthEntries((current) => [...current, entry]); setCreateForm(emptyForm); setCreateOpen(false); showToast("일기를 저장했어요.", "success"); });
  const beginEdit = (entry: Entry) => { setEditingId(entry.id); setEditForm({ title: entry.title, emoji: entry.emotion_emoji, score: entry.emotion_score, content: entry.content }); };
  const update = (id: string) => startTransition(async () => { const result = await updateDiary(id, { title: editForm.title, emotionEmoji: editForm.emoji, emotionScore: editForm.score, content: editForm.content }); if (!result.ok) return showToast(result.error ?? "수정하지 못했어요.", "error"); setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, title: editForm.title, emotion_emoji: editForm.emoji, emotion_score: editForm.score, content: editForm.content } : entry)); setMonthEntries((current) => current.map((entry) => entry.id === id ? { ...entry, emotion_emoji: editForm.emoji, emotion_score: editForm.score } : entry)); setEditingId(null); showToast("수정 내용을 저장했어요.", "success"); });
  const remove = () => { if (!deleteId) return; startTransition(async () => { const result = await trashDiary(deleteId); if (!result.ok) return showToast(result.error ?? "삭제하지 못했어요.", "error"); setEntries((current) => current.filter((entry) => entry.id !== deleteId)); setMonthEntries((current) => current.filter((entry) => entry.id !== deleteId)); setDeleteId(null); setEditingId(null); showToast("일기를 휴지통으로 이동했어요.", "success"); }); };

  return <div className="rk-page"><RecordPageHeader eyebrow="기록 · 일기" title="오늘의 마음" date={date} onDateChange={navigateDate} /><RecordSummaryStrip items={[{ id: "month-count", label: "이달 기록", value: String(recordedDays), suffix: "일" }, { id: "week-mood", label: "주간 기분", value: weekAverage === null ? "—" : String(weekAverage), suffix: "/5" }, { id: "month-mood", label: "월간 기분", value: monthAverage === null ? "—" : String(monthAverage), suffix: "/5" }]} /><CollapsibleRecordCard title="일기 쓰기" open={createOpen} onOpenChange={setCreateOpen}><form className="rk-form" onSubmit={(event) => { event.preventDefault(); create(); }}><RecordDateField value={createDate} onChange={setCreateDate} /><DiaryFields value={createForm} onChange={setCreateForm} /><button className="rk-button primary" disabled={pending} type="submit">{pending ? "저장 중…" : "저장"}</button></form></CollapsibleRecordCard><ActivityCalendar month={month} selectedDate={date} values={calendarValues} onDateSelect={navigateDate} onMonthChange={(nextMonth) => navigateDate(`${nextMonth}-01`)} title="일기 기록" /><section className="rk-list" aria-label={`${date} 일기 목록`}>{visibleEntries.length === 0 ? <p className="rk-empty">이 날짜에 작성한 일기가 없어요.</p> : visibleEntries.map((entry) => <RecordItem key={entry.id}><div className="rk-item-heading"><h2>{entry.title || "제목 없음"}</h2><span>{entry.emotion_emoji} {entry.emotion_score}/5</span></div><p className="rk-original-text">{entry.content}</p><div className="rk-actions"><button className="rk-button secondary" type="button" onClick={() => beginEdit(entry)}>수정</button><button className="rk-button danger" type="button" onClick={() => setDeleteId(entry.id)}>삭제</button></div>{editingId === entry.id ? <InlineRecordEditor><form className="rk-form" onSubmit={(event) => { event.preventDefault(); update(entry.id); }}><DiaryFields value={editForm} onChange={setEditForm} /><div className="rk-actions"><button className="rk-button primary" disabled={pending} type="submit">수정 완료</button><button className="rk-button secondary" type="button" onClick={() => setEditingId(null)}>취소</button></div></form></InlineRecordEditor> : null}</RecordItem>)}</section>{deleteId ? <ConfirmDialog message="이 일기를 30일 휴지통으로 이동할까요?" onCancel={() => setDeleteId(null)} onConfirm={remove} /> : null}</div>;
}

