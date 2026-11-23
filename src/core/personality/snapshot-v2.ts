import type { PersonalityReportV2 } from "./report-v2";

const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const evidence = (value: unknown) => object(value) && nonempty(value.dimension) && nonempty(value.label) &&
  typeof value.score === "number" && Number.isInteger(value.score) && value.score >= 0 && value.score <= 100 &&
  ["low", "mixed", "high"].includes(String(value.band));
const insight = (value: unknown) => object(value) && nonempty(value.title) && nonempty(value.meaning) &&
  nonempty(value.action) && Array.isArray(value.evidence) && value.evidence.length > 0 && value.evidence.every(evidence);
const items = (section: unknown, expected?: number) => object(section) && nonempty(section.title) &&
  Array.isArray(section.items) && (expected === undefined || section.items.length === expected) && section.items.every(insight);

export function isPersonalityReportV2(value: unknown): value is PersonalityReportV2 {
  if (!object(value) || value.reportVersion !== "ieumsae-personality-report-v2" ||
    value.interpretationVersion !== "ieumsae-interpretation-v2" || !nonempty(value.assessmentVersion) ||
    !nonempty(value.scoringVersion) || value.generatedBy !== "predefined_rules" || value.aiUsed !== false ||
    !nonempty(value.headline) || !nonempty(value.disclaimer) || !object(value.sections)) return false;
  const {summary, behavior, personality, motivationExecution, connections, strengths, strategies} = value.sections;
  return object(summary) && nonempty(summary.title) && nonempty(summary.text) && nonempty(summary.strategy) &&
    Array.isArray(summary.evidence) && summary.evidence.length >= 2 && summary.evidence.every(evidence) &&
    items(behavior, 3) && items(personality, 5) && items(motivationExecution, 5) &&
    object(motivationExecution) && nonempty(motivationExecution.synthesis) &&
    object(connections) && nonempty(connections.title) && nonempty(connections.note) &&
    Array.isArray(connections.items) && connections.items.every((entry: unknown) =>
      object(entry) && nonempty(entry.id) && nonempty(entry.title) && nonempty(entry.analysis) &&
      nonempty(entry.strategy) && Array.isArray(entry.dimensions)) &&
    items(strengths) && items(strategies, 4) && object(strategies) && nonempty(strategies.note);
}
