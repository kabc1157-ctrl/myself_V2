import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const emailA = process.env.E2E_TEST_EMAIL;
const passwordA = process.env.E2E_TEST_PASSWORD;
const emailB = process.env.E2E_TEST_EMAIL_B;
const passwordB = process.env.E2E_TEST_PASSWORD_B;
if (!url || !key || !emailA || !passwordA || !emailB || !passwordB) throw new Error("필수 테스트 환경변수가 없습니다.");

const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const result = [];
const mark = (name, ok) => { result.push(`${ok ? "PASS" : "FAIL"} ${name}`); };

const a = client(); const b = client();
const signIn = async (supabase, email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); assert(!error, `로그인 실패: ${error?.code ?? "unknown"}`); };
let diaryIds = []; let routineId = null; let reflectionId = null;
const title = `__E2E_RECORD_${Date.now()}`;
try {
  await signIn(a, emailA, passwordA); await signIn(b, emailB, passwordB);
  const { data: { user: userA } } = await a.auth.getUser(); const { data: { user: userB } } = await b.auth.getUser();
  assert(userA && userB && userA.id !== userB.id, "A/B가 서로 다른 사용자여야 합니다."); mark("A/B 일반 세션 로그인", true);
  const date = new Date().toISOString().slice(0, 10);
  for (const suffix of ["one", "two"]) { const { data, error } = await a.from("diary_entries").insert({ user_id: userA.id, entry_date: date, title: `${title}_${suffix}`, emotion_emoji: suffix === "one" ? "😄" : "😐", emotion_score: suffix === "one" ? 5 : 3, content: `test ${suffix}\nwhitespace` }).select("id").single(); assert(!error && data, `일기 생성 실패: ${error?.code ?? "unknown"}`); diaryIds.push(data.id); }
  const { data: diaries, error: readError } = await a.from("diary_entries").select("id,emotion_score").in("id", diaryIds); assert(!readError && diaries?.length === 2, "동일 날짜 다건 조회 실패"); mark("A 일기 동일 날짜 다건 생성·조회", true);
  const { error: updateError } = await a.from("diary_entries").update({ title: `${title}_updated` }).eq("id", diaryIds[0]); assert(!updateError, "A 일기 수정 실패"); const { error: trashError } = await a.from("diary_entries").update({ deleted_at: new Date().toISOString() }).eq("id", diaryIds[0]); assert(!trashError, "A 일기 휴지통 이동 실패"); const { error: restoreError } = await a.from("diary_entries").update({ deleted_at: null }).eq("id", diaryIds[0]); assert(!restoreError, "A 일기 복원 실패"); mark("A 일기 수정·삭제(휴지통)·복원", true);
  const { data: bDiary, error: bDiaryError } = await b.from("diary_entries").select("id").in("id", diaryIds); assert(!bDiaryError && (!bDiary || bDiary.length === 0), "B가 A 일기를 조회함"); const { data: bUpdate } = await b.from("diary_entries").update({ title: "blocked" }).eq("id", diaryIds[0]).select("id"); assert(!bUpdate || bUpdate.length === 0, "B가 A 일기를 수정함"); const { data: bDelete } = await b.from("diary_entries").delete().eq("id", diaryIds[0]).select("id"); assert(!bDelete || bDelete.length === 0, "B가 A 일기를 삭제함"); mark("B의 A 일기 SELECT·UPDATE·DELETE 차단", true);
  const { data: routine, error: routineError } = await a.from("routine_definitions").insert({ user_id: userA.id, title, period: "morning", weekdays: [1, 2, 3, 4, 5] }).select("id").single(); assert(!routineError && routine, "루틴 생성 실패"); routineId = routine.id; const { error: occurrenceError } = await a.from("routine_occurrences").upsert({ user_id: userA.id, routine_id: routineId, occurrence_date: date, status: "completed", completed_at: new Date().toISOString() }, { onConflict: "routine_id,occurrence_date" }); assert(!occurrenceError, "루틴 완료 저장 실패"); const { data: reflection, error: reflectionError } = await a.from("routine_reflections").insert({ user_id: userA.id, routine_id: routineId, reflection_date: date, content: "__E2E_REFLECTION" }).select("id").single(); assert(!reflectionError && reflection, "회고 생성 실패"); reflectionId = reflection.id; mark("A 루틴 생성·완료·회고 저장", true);
  const { data: bRoutine } = await b.from("routine_definitions").select("id").eq("id", routineId); const { data: bReflection } = await b.from("routine_reflections").select("id").eq("id", reflectionId); assert((!bRoutine || bRoutine.length === 0) && (!bReflection || bReflection.length === 0), "B가 A 루틴 또는 회고를 조회함"); mark("B의 A 루틴·회고 조회 차단", true);
} catch (error) { mark(error instanceof Error ? error.message : "알 수 없는 검증 오류", false); } finally {
  if (routineId) await a.from("routine_definitions").delete().eq("id", routineId).eq("title", title);
  if (diaryIds.length) await a.from("diary_entries").delete().in("id", diaryIds);
  await a.auth.signOut(); await b.auth.signOut();
  console.log(result.join("\n"));
  if (result.some(line => line.startsWith("FAIL"))) process.exitCode = 1;
}
