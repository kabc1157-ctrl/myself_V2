"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveAssessmentDraft } from "@/core/onboarding/actions";
import { completePersonalityAssessment } from "@/core/personality/actions";
import {
  ASSESSMENT_ITEMS,
  ASSESSMENT_ITEM_COUNT,
  ASSESSMENT_SCALE,
  assessmentGroup,
} from "@/core/personality/questions";

type Props = {
  answers: Record<string, string>;
  setAnswers: (answers: Record<string, string>) => void;
  onSkip?: () => void;
  onBack: () => void;
  onComplete: () => void;
  pending: boolean;
};

function firstOpenQuestion(answers: Record<string, string>): number {
  const next = ASSESSMENT_ITEMS.findIndex((item) =>
    !ASSESSMENT_SCALE.some((option) => option.value === answers[item.id]),
  );
  return next === -1 ? ASSESSMENT_ITEM_COUNT - 1 : next;
}

/** All 35 answers are saved before trusted, one-time server submission. */
export function PersonalityAssessmentForm({ answers, setAnswers, onSkip, onBack, onComplete, pending }: Props) {
  const [index, setIndex] = useState(() => firstOpenQuestion(answers));
  const [changeRevision, setChangeRevision] = useState(0);
  const [savedRevision, setSavedRevision] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [autoSavePaused, setAutoSavePaused] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const revisionRef = useRef(0);
  const savedRevisionRef = useRef(0);
  const latestAnswersRef = useRef(answers);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => { latestAnswersRef.current = answers; }, [answers]);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) await inFlightRef.current;
    if (savedRevisionRef.current >= revisionRef.current) return true;

    const snapshot = { ...latestAnswersRef.current };
    const revision = revisionRef.current;
    setIsSaving(true);
    setSaveError("");

    const request = saveAssessmentDraft(snapshot)
      .then((result) => {
        if (result.ok) {
          savedRevisionRef.current = Math.max(savedRevisionRef.current, revision);
          setSavedRevision(savedRevisionRef.current);
          setShowSaved(true);
          setAutoSavePaused(false);
          return true;
        }
        setSaveError(result.error ?? "답변을 저장하지 못했어요.");
        setAutoSavePaused(true);
        return false;
      })
      .catch(() => {
        setSaveError("연결을 확인하고 저장을 다시 시도해 주세요.");
        setAutoSavePaused(true);
        return false;
      });

    inFlightRef.current = request;
    const ok = await request;
    if (inFlightRef.current === request) inFlightRef.current = null;
    setIsSaving(false);
    return ok;
  }, []);

  useEffect(() => {
    if (changeRevision <= savedRevision || isSaving || isCompleting || autoSavePaused || pending) return;
    const timeout = window.setTimeout(() => { void saveNow(); }, 700);
    return () => window.clearTimeout(timeout);
  }, [changeRevision, savedRevision, isSaving, isCompleting, autoSavePaused, pending, saveNow]);

  const question = ASSESSMENT_ITEMS[index];
  const selected = answers[question.id];
  const answered = ASSESSMENT_ITEMS.filter((item) =>
    ASSESSMENT_SCALE.some((option) => option.value === answers[item.id]),
  ).length;
  const percent = Math.round((answered / ASSESSMENT_ITEM_COUNT) * 100);
  const group = assessmentGroup(index);
  const isDirty = changeRevision > savedRevision;

  const selectAnswer = (value: string) => {
    const next = { ...answers, [question.id]: value };
    latestAnswersRef.current = next;
    setAnswers(next);
    revisionRef.current += 1;
    setChangeRevision(revisionRef.current);
    setShowSaved(false);
    setAutoSavePaused(false);
    setSaveError("");
  };

  const leave = async (next: () => void) => {
    if (pending || isSaving || isCompleting) return;
    if (isDirty && !(await saveNow())) return;
    next();
  };

  const submitCompletedAssessment = async () => {
    if (answered !== ASSESSMENT_ITEM_COUNT || pending || isSaving || isCompleting) return;
    setIsCompleting(true);
    setSaveError("");
    try {
      if (!(await saveNow())) return;
      const result = await completePersonalityAssessment({ ...latestAnswersRef.current });
      if (!result.ok) {
        setSaveError(result.error ?? "결과를 저장하지 못했어요.");
        return;
      }
      onComplete();
    } catch {
      setSaveError("결과를 저장할 수 없어요. 다시 시도해 주세요.");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <section aria-label="성향 검사 35문항">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">나를 알아가는 성향 검사</h2>
        <span className="whitespace-nowrap text-sm text-stone-500">{index + 1} / {ASSESSMENT_ITEM_COUNT}</span>
      </div>
      <p className="mt-2 text-sm text-stone-600">지난 몇 주간의 평소 모습을 떠올리며 답해 주세요. 정답은 없어요.</p>
      <p className="mt-2 text-xs text-stone-500">
        자기이해를 위한 예비 문항입니다. 표준화된 진단 검사가 아니며, 응답을 제출하면 최초 1회 결과가 확정되고 수정할 수 없어요.
      </p>

      <div className="mt-6 flex items-center justify-between text-sm text-stone-600">
        <span>응답한 문항 {answered}개</span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200" aria-label={`전체 응답 진행률 ${percent}%`} role="progressbar" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={ASSESSMENT_ITEM_COUNT}>
        <div className="h-full rounded-full bg-[#FFBE46] transition-all" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-7 rounded-2xl border border-stone-200 bg-[#FFF9EE] px-4 py-6 sm:px-6">
        <p className="text-xs font-semibold tracking-wide text-[#866433]">{group.title}</p>
        <p className="mt-1 text-xs text-stone-500">{group.description}</p>
        <fieldset className="mt-6">
          <legend className="mb-6 text-lg font-semibold leading-relaxed text-stone-900 sm:text-xl">
            {question.text}
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {ASSESSMENT_SCALE.map(({ value, label }) => {
              const active = selected === value;
              return (
                <label key={value} className={`flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-colors focus-within:ring-2 focus-within:ring-amber-500 ${active ? "border-[#DB9F2E] bg-[#FFE3A5]" : "border-stone-200 bg-white hover:border-amber-300"}`}>
                  <input
                    className="sr-only"
                    type="radio"
                    name={question.id}
                    value={value}
                    checked={active}
                    disabled={pending || isSaving || isCompleting}
                    onChange={() => selectAnswer(value)}
                    aria-label={`${value}점, ${label}`}
                  />
                  <span className="text-lg font-semibold">{value}</span>
                  <span className="mt-1 text-[10px] leading-4 sm:text-xs">{label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <p aria-live="polite" className={`mt-4 min-h-5 text-sm ${saveError ? "text-red-700" : "text-stone-500"}`}>
        {saveError || (isSaving ? "답변을 저장하고 있어요." : isDirty ? "잠시 후 자동 저장돼요." : showSaved ? "답변이 저장됐어요." : "응답을 선택하면 자동 저장돼요.")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="rounded-xl border border-stone-300 p-3 text-sm" disabled={pending || isSaving || isCompleting || index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          이전 문항
        </button>
        <button type="button" className="rounded-xl bg-stone-900 p-3 text-sm text-white disabled:opacity-40" disabled={pending || isSaving || isCompleting || !selected || index >= ASSESSMENT_ITEM_COUNT - 1} onClick={() => setIndex((i) => Math.min(ASSESSMENT_ITEM_COUNT - 1, i + 1))}>
          다음 문항
        </button>
      </div>
      {answered === ASSESSMENT_ITEM_COUNT && (
        <div className="mt-4 space-y-3 rounded-xl bg-[#FFF4DC] p-4 text-sm text-stone-800">
          <p>35문항을 모두 응답했어요. 제출하면 성향 점수와 7개 영역의 리포트가 저장되며, 이후 재검사하거나 수정할 수 없어요.</p>
          <button type="button" className="w-full rounded-xl bg-[#FFBE46] p-3 font-semibold text-stone-900 disabled:opacity-50"
            disabled={pending || isSaving || isCompleting} onClick={() => { void submitCompletedAssessment(); }}>
            {isCompleting ? "결과를 저장하는 중" : "검사 최종 제출"}
          </button>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="flex-1 rounded-xl border p-3 text-sm disabled:opacity-50" disabled={pending || isSaving || isCompleting} onClick={() => { void saveNow(); }}>
          {isSaving ? "저장 중" : "지금 저장"}
        </button>
        <button type="button" className="flex-1 rounded-xl border p-3 text-sm disabled:opacity-50" disabled={pending || isSaving || isCompleting} onClick={() => { void leave(onBack); }}>
          프로필로 돌아가기
        </button>
        {onSkip && (
          <button type="button" className="w-full rounded-xl border border-dashed border-amber-400 p-3 text-sm text-amber-800 disabled:opacity-50" disabled={pending || isSaving || isCompleting} onClick={() => { void leave(onSkip); }}>
            검사 완료 없이 건너뛰고 다음 설정으로
          </button>
        )}
      </div>
    </section>
  );
}
