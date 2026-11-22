import type { PersonalityReport } from "./report";
import { PERSONALITY_DIMENSIONS } from "./questions";

type Obj = Record<string, unknown>;
const obj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const dimension = (v: unknown) => typeof v === "string" && PERSONALITY_DIMENSIONS.some(key => key === v);
const score = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100;
const band = (v: unknown) => v === "low" || v === "mixed" || v === "high";
const highlight = (v: unknown): v is Obj => obj(v) && dimension(v.dimension) && str(v.label) && score(v.score) && band(v.band);
const explanation = (v: unknown) => highlight(v) && Number.isInteger(v.itemCount) &&
  typeof v.itemCount === "number" && v.itemCount > 0 && str(v.summary) && str(v.lifeMeaning) &&
  (v.observation === null || str(v.observation));
const strings = (v: unknown) => Array.isArray(v) && v.every(str);

/** Validate stored reports against the renderer's complete shape. Never rewrite
 * or regenerate a completed snapshot to repair an invalid historic result. */
export function isPersonalityReportSnapshot(value: unknown): value is PersonalityReport {
  if (!obj(value) || !str(value.headline) || !str(value.disclaimer) ||
      value.reportVersion !== "ieumsae-personality-report-v1" ||
      value.interpretationVersion !== "ieumsae-interpretation-v1" ||
      !str(value.assessmentVersion) || !str(value.scoringVersion) ||
      value.generatedBy !== "predefined_rules" || value.aiUsed !== false ||
      !obj(value.sections)) return false;
  const { summary, personality, motivation, execution, connections, strengthsAndWatchouts: strengths, strategies } = value.sections;
  if (!obj(summary) || !obj(personality) || !obj(motivation) || !obj(execution) ||
      !obj(connections) || !obj(strengths) || !obj(strategies)) return false;
  const dims = (part: Obj, expected: readonly string[]) =>
    Array.isArray(part.dimensions) && part.dimensions.length === expected.length &&
    part.dimensions.every((v: unknown, i: number) => explanation(v) && obj(v) && v.dimension === expected[i]);
  return summary.title === "나의 성향 요약" && str(summary.text) &&
    Array.isArray(summary.prominent) && summary.prominent.length > 0 && summary.prominent.length <= 3 &&
    summary.prominent.every(highlight) &&
    personality.title === "나의 성격 특성" && dims(personality, PERSONALITY_DIMENSIONS.slice(0, 5)) &&
    motivation.title === "나를 움직이는 동기" && dims(motivation, PERSONALITY_DIMENSIONS.slice(5, 7)) && str(motivation.interaction) &&
    execution.title === "나의 실행 방식" && dims(execution, PERSONALITY_DIMENSIONS.slice(7)) && str(execution.observation) &&
    connections.title === "성향의 연결" && str(connections.note) &&
    Array.isArray(connections.items) && connections.items.length <= 3 &&
    connections.items.every((v: unknown) => obj(v) && str(v.id) && str(v.title) && str(v.analysis) &&
      str(v.strategy) && str(v.note) && Array.isArray(v.dimensions) && v.dimensions.every(dimension)) &&
    strengths.title === "나의 강점과 주의점" && strings(strengths.possibleStrengths) && strings(strengths.watchouts) &&
    strategies.title === "나를 위한 생활 전략" && Array.isArray(strategies.items) &&
    strategies.items.every((v: unknown) => obj(v) && typeof v.area === "string" &&
      ["routine", "goal", "schedule", "reflection", "relationship"].includes(v.area) &&
      str(v.title) && str(v.action));
}
