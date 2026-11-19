"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordPageHeader } from "@/shared/components/record-kit";
import { useToast } from "@/shared/components/toast-provider";
import { controlTimer } from "@/core/schedule-actions";

type Todo = { id: string; title: string } | null;
type Plan = { id: string; todo_id: string; starts_at: string; ends_at: string } | null;
type Session = { id: string; todo_id: string; status: "running" | "paused"; started_at: string | null; accumulated_seconds: number; manual_seconds: number | null } | null;

const format = (seconds: number) => `${String(Math.floor(Math.max(0, seconds) / 3600)).padStart(2, "0")}:${String(Math.floor(Math.max(0, seconds) % 3600 / 60)).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;

export function TimerClient({ date, todo, plan, session, otherActive }: { date: string; todo: Todo; plan: Plan; session: Session; otherActive: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, start] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (session?.status !== "running") return; const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, [session?.id, session?.status]);
  const plannedSeconds = plan ? Math.max(0, Math.floor((new Date(plan.ends_at).getTime() - new Date(plan.starts_at).getTime()) / 1000)) : 0;
  const elapsedSeconds = session ? session.accumulated_seconds + (session.status === "running" && session.started_at ? Math.floor((now - new Date(session.started_at).getTime()) / 1000) : 0) : 0;
  const difference = elapsedSeconds - plannedSeconds;
  const action = (value: "start" | "pause" | "resume" | "stop") => start(async () => {
    if (!todo) return;
    const result = await controlTimer({ action: value, todoId: todo.id, date, sessionId: session?.id });
    showToast(result.ok ? value === "start" ? "타이머를 시작했어요." : value === "stop" ? "타이머를 종료했어요." : value === "pause" ? "일시정지했어요." : "타이머를 재개했어요." : result.error ?? "타이머를 처리하지 못했어요.", result.ok ? "success" : "error");
    if (result.ok) router.refresh();
  });
  const differenceLabel = useMemo(() => difference === 0 ? "계획과 같아요" : difference > 0 ? `${format(difference)} 초과` : `${format(Math.abs(difference))} 남음`, [difference]);
  return <div className="rk-page timer-page"><RecordPageHeader eyebrow="일정 관리 · 타이머" title="실행 시간 기록" />{!todo ? <p className="rk-empty">실행할 TODO를 선택해 주세요.</p> : <><section className="timer-card"><p className="record-muted">{date}</p><h2>{todo.title}</h2><strong className="timer-clock">{format(elapsedSeconds)}</strong><div className="timer-actions">{!session ? <button className="rk-button primary" type="button" disabled={pending || otherActive} onClick={() => action("start")}>시작</button> : session.status === "running" ? <button className="rk-button primary" type="button" disabled={pending} onClick={() => action("pause")}>일시정지</button> : <button className="rk-button primary" type="button" disabled={pending} onClick={() => action("resume")}>재개</button>}{session ? <button className="rk-button danger" type="button" disabled={pending} onClick={() => action("stop")}>종료</button> : null}</div>{otherActive && !session ? <p className="timer-warning">이미 실행 중인 타이머가 있어요. 기존 타이머를 먼저 종료해 주세요.</p> : null}</section><section className="timer-metrics"><article><span>계획</span><strong>{format(plannedSeconds)}</strong></article><article><span>실제</span><strong>{format(elapsedSeconds)}</strong></article><article><span>차이</span><strong>{differenceLabel}</strong></article></section><a className="rk-button secondary timer-back" href={`/schedule?date=${date}`}>일정 관리로 돌아가기</a></>}</div>;
}
