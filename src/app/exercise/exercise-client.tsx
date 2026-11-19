"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ActivityCalendar,
  CollapsibleRecordCard,
  RecordDateField,
  RecordItem,
  RecordPageHeader,
} from "@/shared/components/record-kit";
import { deleteExercise, saveExercise } from "@/core/exercise-actions";
import { useToast } from "@/shared/components/toast-provider";
type ExerciseRecord = {
  id: string;
  exercise_date: string;
  exercise_type: string;
  focus_area: string;
  memo: string;
  created_at: string;
  updated_at: string;
};
const labels: Record<string, string> = {
  cardio: "유산소",
  strength: "근력",
  stretching: "스트레칭",
};
const icons: Record<string, string> = {
  cardio: "🏃",
  strength: "💪",
  stretching: "🧘",
};
export function ExerciseClient({
  today,
  date,
  month,
  weekStartsOn,
  records,
}: {
  today: string;
  date: string;
  month: string;
  weekStartsOn: "monday" | "sunday";
  records: ExerciseRecord[];
}) {
  const r = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseRecord | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    exerciseDate: date,
    exerciseType: "cardio",
    focusArea: "",
    memo: "",
  });
  const selected = records.filter((x) => x.exercise_date === date);
  const daysByType = useMemo(
    () => ({
      cardio: new Set(
        records
          .filter((x) => x.exercise_type === "cardio")
          .map((x) => x.exercise_date),
      ).size,
      strength: new Set(
        records
          .filter((x) => x.exercise_type === "strength")
          .map((x) => x.exercise_date),
      ).size,
      stretching: new Set(
        records
          .filter((x) => x.exercise_type === "stretching")
          .map((x) => x.exercise_date),
      ).size,
    }),
    [records],
  );
  const run = async (
    work: () => Promise<{ ok: boolean; error?: string }>,
    message: string,
    done?: () => void,
  ) => {
    setPending(true);
    const x = await work();
    setPending(false);
    if (!x.ok) {
      showToast(x.error ?? "처리하지 못했어요.", "error");
      return;
    }
    done?.();
    showToast(message, "success");
    r.refresh();
  };
  const setDate = (d: string) => {
    setForm((v) => ({ ...v, exerciseDate: d }));
    setEditing(null);
    setOpen(false);
    r.push(`/exercise?date=${d}`, { scroll: false });
  };
  const values = Array.from(new Set(records.map((x) => x.exercise_date))).map(
    (d) => ({
      date: d,
      label: Array.from(
        new Set(
          records
            .filter((x) => x.exercise_date === d)
            .map((x) => icons[x.exercise_type]),
        ),
      ).join(""),
    }),
  );
  const startEdit = (item: ExerciseRecord) => {
    setEditing(item);
    setOpen(false);
    setForm({
      exerciseDate: item.exercise_date,
      exerciseType: item.exercise_type,
      focusArea: item.focus_area,
      memo: item.memo,
    });
  };
  const editFields = (
    <div className="rk-form exercise-inline-edit">
      <RecordDateField
        value={form.exerciseDate}
        onChange={(v) => setForm({ ...form, exerciseDate: v })}
      />
      <label>
        운동 종류
        <select
          value={form.exerciseType}
          onChange={(e) => setForm({ ...form, exerciseType: e.target.value })}
        >
          <option value="cardio">유산소</option>
          <option value="strength">근력</option>
          <option value="stretching">스트레칭</option>
        </select>
      </label>
      <label>
        집중 부위
        <input
          value={form.focusArea}
          onChange={(e) => setForm({ ...form, focusArea: e.target.value })}
          placeholder="예: 하체, 어깨"
        />
      </label>
      <label>
        메모
        <textarea
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          placeholder="오늘의 운동 메모"
        />
      </label>
      <div className="rk-actions">
        <button
          className="rk-button primary"
          disabled={pending}
          onClick={() =>
            run(
              () => saveExercise({ ...form, id: editing?.id }),
              "운동 기록을 수정했어요.",
              () => {
                setEditing(null);
                setForm({
                  exerciseDate: date,
                  exerciseType: "cardio",
                  focusArea: "",
                  memo: "",
                });
              },
            )
          }
        >
          수정 완료
        </button>
        <button
          className="rk-button secondary"
          onClick={() => setEditing(null)}
        >
          취소
        </button>
      </div>
    </div>
  );
  return (
    <div className="rk-page exercise-page">
      <RecordPageHeader eyebrow="기록 ・ 건강" title="오늘의 운동" />
      <section className="exercise-stats">
        <article>
          <span>유산소 운동 일수</span>
          <strong>{daysByType.cardio}일</strong>
        </article>
        <article>
          <span>근력 운동 일수</span>
          <strong>{daysByType.strength}일</strong>
        </article>
        <article>
          <span>스트레칭 운동 일수</span>
          <strong>{daysByType.stretching}일</strong>
        </article>
      </section>
      <CollapsibleRecordCard
        title="운동 기록 추가"
        open={open && !editing}
        onOpenChange={setOpen}
      >
        <div className="rk-form">
          <RecordDateField
            value={form.exerciseDate}
            onChange={(v) => setForm({ ...form, exerciseDate: v })}
          />
          <label>
            운동 종류
            <select
              value={form.exerciseType}
              onChange={(e) =>
                setForm({ ...form, exerciseType: e.target.value })
              }
            >
              <option value="cardio">유산소</option>
              <option value="strength">근력</option>
              <option value="stretching">스트레칭</option>
            </select>
          </label>
          <label>
            집중 부위
            <input
              value={form.focusArea}
              onChange={(e) => setForm({ ...form, focusArea: e.target.value })}
              placeholder="예: 하체, 어깨"
            />
          </label>
          <label>
            메모
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="오늘의 운동 메모"
            />
          </label>
          <div className="rk-actions">
            <button
              className="rk-button primary"
              disabled={pending}
              onClick={() =>
                run(
                  () => saveExercise(form),
                  "운동 기록을 저장했어요.",
                  () => {
                    setForm({
                      exerciseDate: date,
                      exerciseType: "cardio",
                      focusArea: "",
                      memo: "",
                    });
                    setOpen(false);
                  },
                )
              }
            >
              저장
            </button>
          </div>
        </div>
      </CollapsibleRecordCard>
      <ActivityCalendar
        month={month}
        selectedDate={date}
        values={values}
        onDateSelect={setDate}
        onMonthChange={(m) =>
          r.push(`/exercise?date=${m}-01`, { scroll: false })
        }
        title="운동 기록"
        maxDate={today}
        weekStartsOn={weekStartsOn}
      />
      <section className="exercise-detail">
        <h2 className="rk-section-title">{date} 운동 기록</h2>
        {selected.length ? (
          selected.map((item) => (
            <RecordItem key={item.id}>
              <div className="exercise-row">
                <div>
                  <strong>
                    {icons[item.exercise_type]} {labels[item.exercise_type]}
                  </strong>
                  <span>{item.focus_area || "집중 부위 없음"}</span>
                  <p className="rk-original-text">{item.memo}</p>
                </div>
                <div className="rk-actions">
                  <button
                    className="rk-button secondary"
                    onClick={() => startEdit(item)}
                  >
                    수정
                  </button>
                  <button
                    className="rk-button danger"
                    onClick={() =>
                      run(
                        () => deleteExercise(item.id),
                        "운동 기록을 삭제했어요.",
                      )
                    }
                  >
                    삭제
                  </button>
                </div>
              </div>
              {editing?.id === item.id ? editFields : null}
            </RecordItem>
          ))
        ) : (
          <p className="rk-empty">이 날짜의 운동 기록이 없어요.</p>
        )}
      </section>
    </div>
  );
}
