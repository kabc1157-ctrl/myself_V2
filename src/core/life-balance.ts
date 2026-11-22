export const LIFE_AREAS = ["asset", "relationship", "career", "health"] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];
export type LifeBalancePeriod = "all" | "1y" | "6m" | "1m" | "7d";
export type LifeBalanceCounts = Record<LifeArea, number>;
export const LIFE_BALANCE_PERIODS: { value: LifeBalancePeriod; label: string }[] = [
  { value: "all", label: "전체" }, { value: "1y", label: "최근 1년" },
  { value: "6m", label: "최근 6달" }, { value: "1m", label: "최근 1달" },
  { value: "7d", label: "최근 7일" },
];
export const LIFE_AREA_LABELS: Record<LifeArea, string> = {
  asset: "자산", relationship: "관계", career: "커리어", health: "건강",
};
export const LIFE_AREA_COLORS: Record<LifeArea, string> = {
  asset: "#FFD36E", relationship: "#92D69A", career: "#FF9B8D", health: "#8ABCF0",
};
export function isLifeArea(value: unknown): value is LifeArea {
  return typeof value === "string" && LIFE_AREAS.some((area) => area === value);
}
export function emptyLifeBalance(): LifeBalanceCounts {
  return { asset: 0, relationship: 0, career: 0, health: 0 };
}
export function lifeBalanceStartDate(period: LifeBalancePeriod, today: string): string | null {
  if (period === "all") return null;
  const value = new Date(today + "T00:00:00Z");
  if (period === "7d") value.setUTCDate(value.getUTCDate() - 6);
  else {
    const originalDay = value.getUTCDate();
    value.setUTCDate(1);
    if (period === "1m") value.setUTCMonth(value.getUTCMonth() - 1);
    else if (period === "6m") value.setUTCMonth(value.getUTCMonth() - 6);
    else value.setUTCFullYear(value.getUTCFullYear() - 1);
    const lastDay = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
    value.setUTCDate(Math.min(originalDay, lastDay));
  }
  return value.toISOString().slice(0, 10);
}
type Project = { id: string; classification: string | null };
type Todo = { id: string; project_id: string | null; life_area: string | null; is_completed: boolean; completed_at: string | null };
type Routine = { id: string; life_area: string | null };
type Occurrence = { routine_id: string; occurrence_date: string; status: string };
type Exercise = { id: string; exercise_date: string };
type CalendarArea = { event_id: string; event_date: string; life_area: string };
type Completion = { source_type: string; source_id: string; completion_date: string };
export type LifeBalanceSources = {
  projects: Project[]; todos: Todo[]; routines: Routine[]; occurrences: Occurrence[];
  exercises: Exercise[]; calendarAreas: CalendarArea[]; completions: Completion[];
};
function dayOf(timestamp: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp));
}
export function summarizeLifeBalance(
  sources: LifeBalanceSources, period: LifeBalancePeriod, today: string, timeZone = "Asia/Seoul",
): LifeBalanceCounts {
  const counts = emptyLifeBalance();
  const start = lifeBalanceStartDate(period, today);
  const inRange = (day: string) => day <= today && (!start || day >= start);
  const seen = new Set<string>();
  const count = (source: string, id: string, day: string, area: unknown) => {
    if (!isLifeArea(area) || !inRange(day)) return;
    const key = source + ":" + id + ":" + day;
    if (seen.has(key)) return;
    seen.add(key);
    counts[area] += 1;
  };
  const projectMap = new Map(sources.projects.map((project) => [project.id, project.classification]));
  for (const todo of sources.todos) {
    if (!todo.is_completed || !todo.completed_at) continue;
    const classification = todo.project_id ? projectMap.get(todo.project_id) : todo.life_area;
    // A linked TODO always inherits its project classification.
    count("todo", todo.id, dayOf(todo.completed_at, timeZone), classification);
  }
  const routineMap = new Map(sources.routines.map((routine) => [routine.id, routine.life_area ?? "health"]));
  for (const occurrence of sources.occurrences) {
    if (occurrence.status !== "completed") continue;
    count("routine", occurrence.routine_id, occurrence.occurrence_date, routineMap.get(occurrence.routine_id));
  }
  for (const exercise of sources.exercises) count("exercise", exercise.id, exercise.exercise_date, "health");
  const completedGoogle = new Set(
    sources.completions
      .filter((entry) => entry.source_type === "google")
      .map((entry) => entry.source_id + "\u0000" + entry.completion_date),
  );
  for (const event of sources.calendarAreas) {
    if (completedGoogle.has(event.event_id + "\u0000" + event.event_date))
      count("google", event.event_id, event.event_date, event.life_area);
  }
  return counts;
}
