import type { PersonalityReport } from "./report";

/**
 * Validate the persisted shape before rendering. Never recalculate historical
 * reports with today's interpretation rules: completed snapshots are immutable.
 */
export function isPersonalityReportSnapshot(value: unknown): value is PersonalityReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  if (typeof report.headline !== "string" || typeof report.disclaimer !== "string") return false;
  const sections = report.sections;
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return false;
  const s = sections as Record<string, unknown>;
  const objectPart = (key: string): Record<string, unknown> | null =>
    s[key] && typeof s[key] === "object" && !Array.isArray(s[key])
      ? (s[key] as Record<string, unknown>)
      : null;
  const summary = objectPart("summary");
  const personality = objectPart("personality");
  const motivation = objectPart("motivation");
  const execution = objectPart("execution");
  const connections = objectPart("connections");
  const strengths = objectPart("strengthsAndWatchouts");
  const strategies = objectPart("strategies");
  if (!summary || !personality || !motivation || !execution || !connections || !strengths || !strategies) return false;
  const dimsValid = (part: Record<string, unknown>) =>
    Array.isArray(part.dimensions) &&
    part.dimensions.every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const d = item as Record<string, unknown>;
      return typeof d.label === "string" && typeof d.summary === "string" &&
        typeof d.lifeMeaning === "string" && typeof d.score === "number" &&
        Number.isInteger(d.score) && d.score >= 0 && d.score <= 100;
    });
  return typeof summary.text === "string" && Array.isArray(summary.prominent) &&
    dimsValid(personality) && dimsValid(motivation) && dimsValid(execution) &&
    typeof motivation.interaction === "string" && typeof execution.observation === "string" &&
    Array.isArray(connections.items) && typeof connections.note === "string" &&
    Array.isArray(strengths.possibleStrengths) && Array.isArray(strengths.watchouts) &&
    Array.isArray(strategies.items);
}
