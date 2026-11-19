import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_ITEMS,
  PERSONALITY_DIMENSIONS,
  type PersonalityDimension,
} from "./questions";
import { calculatePersonalityScores } from "./scoring";
import { COMBINATION_RULES, selectPersonalityCombinations } from "./combinations";
import { INTERPRETATION_RULES } from "./interpretations";
import {
  createPersonalityReport,
  PERSONALITY_INTERPRETATION_VERSION,
  PERSONALITY_REPORT_VERSION,
} from "./report";

type Choice = 1 | 2 | 3 | 4 | 5;

function makeAnswers(
  adjustedByDimension: Partial<Record<PersonalityDimension, Choice>> = {},
): Record<string, string> {
  return Object.fromEntries(ASSESSMENT_ITEMS.map((item) => {
    const adjusted = adjustedByDimension[item.dimension] ?? 3;
    const raw = item.reverseScored ? 6 - adjusted : adjusted;
    return [item.id, String(raw)];
  }));
}

describe("P3 interpretation dictionary", () => {
  it("defines 30 complete low/mixed/high interpretation rules", () => {
    expect(PERSONALITY_DIMENSIONS).toHaveLength(10);
    for (const dimension of PERSONALITY_DIMENSIONS) {
      expect(Object.keys(INTERPRETATION_RULES[dimension]).sort())
        .toEqual(["high", "low", "mixed"]);
      for (const band of ["low", "mixed", "high"] as const) {
        const rule = INTERPRETATION_RULES[dimension][band];
        for (const value of Object.values(rule)) {
          expect(typeof value).toBe("string");
          expect(value.trim().length).toBeGreaterThan(8);
        }
      }
    }
  });

  it("defines the six agreed exploratory combinations", () => {
    expect(COMBINATION_RULES).toHaveLength(6);
    expect(new Set(COMBINATION_RULES.map((rule) => rule.id)).size).toBe(6);
  });
});

describe("P3 report generation", () => {
  it("produces all seven sections from neutral 35-item answers without AI", () => {
    const input = makeAnswers();
    const { scores, report } = createPersonalityReport(input);
    expect(scores.totalItems).toBe(35);
    expect(report.reportVersion).toBe(PERSONALITY_REPORT_VERSION);
    expect(report.interpretationVersion).toBe(PERSONALITY_INTERPRETATION_VERSION);
    expect(report.assessmentVersion).toBe(scores.assessmentVersion);
    expect(report.scoringVersion).toBe(scores.scoringVersion);
    expect(report.aiUsed).toBe(false);
    expect(report.generatedBy).toBe("predefined_rules");
    expect(Object.keys(report.sections)).toEqual([
      "summary", "personality", "motivation", "execution",
      "connections", "strengthsAndWatchouts", "strategies",
    ]);
    expect(report.sections.personality.dimensions).toHaveLength(5);
    expect(report.sections.motivation.dimensions).toHaveLength(2);
    expect(report.sections.execution.dimensions).toHaveLength(3);
    expect(report.sections.connections.items).toHaveLength(0);
    expect(report.sections.summary.prominent.length).toBeGreaterThanOrEqual(2);
    expect(report.sections.summary.prominent.length).toBeLessThanOrEqual(3);
    expect(report.sections.strengthsAndWatchouts.possibleStrengths.length).toBeGreaterThanOrEqual(2);
    expect(report.sections.strengthsAndWatchouts.watchouts.length).toBeGreaterThanOrEqual(2);
    expect(report.sections.strategies.items.length).toBeGreaterThanOrEqual(3);
    expect(report.sections.strategies.items.length).toBeLessThanOrEqual(5);
    expect(report.headline).toContain("상황");
    expect(report.disclaimer).toContain("백분위");
    expect(JSON.stringify(report)).not.toContain("q35");
  });

  it("preserves independent promotion/prevention descriptions and both-high analysis", () => {
    const { report } = createPersonalityReport(makeAnswers({ promotion: 5, prevention: 5 }));
    expect(report.sections.motivation.dimensions.map((d) => d.score)).toEqual([100, 100]);
    expect(report.sections.motivation.interaction).toContain("함께");
    expect(report.sections.connections.items.some((c) => c.id === "promotion-high-prevention-high")).toBe(true);
  });

  it("matches each of the six agreed combinations when only its conditions hold", () => {
    for (const rule of COMBINATION_RULES) {
      const desired = Object.fromEntries(
        Object.entries(rule.required).map(([key, band]) =>
          [key, band === "high" ? 5 : 1],
        ),
      ) as Partial<Record<PersonalityDimension, Choice>>;
      const { scores } = createPersonalityReport(makeAnswers(desired));
      const matched = selectPersonalityCombinations(scores, 3);
      expect(matched.map((combo) => combo.id)).toContain(rule.id);
    }
  });

  it("never selects over three combinations, even when many match", () => {
    const { scores, report } = createPersonalityReport(makeAnswers({
      openness: 5,
      conscientiousness: 1,
      extraversion: 1,
      agreeableness: 5,
      promotion: 5,
      prevention: 5,
      time_centered: 5,
      cue_centered: 5,
    }));
    expect(COMBINATION_RULES).toBeDefined();
    expect(report.sections.connections.items).toHaveLength(3);
    expect(selectPersonalityCombinations(scores, 0)).toEqual([]);
    expect(() => selectPersonalityCombinations(scores, 4)).toThrow();
  });

  it("suppresses a combination on internally conflicting responses", () => {
    const answers = makeAnswers({ openness: 5, promotion: 5 });
    const reverseFlag = ASSESSMENT_ITEMS.find((item) => item.id === "q4");
    expect(reverseFlag?.reverseScored).toBe(true);
    // q1-3 adjusted 5 and q4 adjusted 1 => openness 75, spread 4.
    answers.q4 = "5";
    const { scores, report } = createPersonalityReport(answers);
    expect(scores.dimensions.openness.score).toBe(75);
    expect(scores.dimensions.openness.adjustedResponseSpread).toBe(4);
    expect(report.sections.personality.dimensions[0].observation).not.toBeNull();
    expect(report.sections.connections.items.some((c) => c.id === "openness-high-promotion-high")).toBe(false);
  });

  it("returns distinct practical actions, stable revisions and no raw answers", () => {
    const answers = Object.freeze(makeAnswers({ openness: 5, time_centered: 5 }));
    const before = JSON.stringify(answers);
    const one = createPersonalityReport(answers);
    const two = createPersonalityReport(answers);
    expect(one).toEqual(two);
    expect(JSON.stringify(answers)).toBe(before);
    expect(one.report.sections.strategies.items.map((s) => s.area).slice(0, 4))
      .toEqual(["routine", "goal", "schedule", "reflection"]);
    expect(one.report.sections.strategies.items.every((s) => s.action.length > 10)).toBe(true);
    expect(Object.values(one.report.sections).every((section) => section.title.length > 0)).toBe(true);
  });

  it("rejects incomplete and invalid responses rather than producing a report", () => {
    expect(() => createPersonalityReport({ q1: "5" })).toThrow();
    expect(() => createPersonalityReport({ ...makeAnswers(), q10: "6" })).toThrow();
    expect(() => createPersonalityReport(null)).toThrow();
  });

  it("uses low bands as preference descriptions, not insulting labels", () => {
    const { report } = createPersonalityReport(makeAnswers({ conscientiousness: 1, extraversion: 1 }));
    const text = JSON.stringify(report);
    expect(text).not.toContain("게으르");
    expect(text).not.toContain("사회성 부족");
    expect(text).not.toContain("정신질환");
    expect(report.sections.personality.dimensions[1].score).toBe(0);
    expect(report.sections.personality.dimensions[2].score).toBe(0);
  });

  it("keeps result scores identical to the independent scoring engine", () => {
    const answers = makeAnswers({ openness: 4, time_centered: 5, cue_centered: 1 });
    expect(createPersonalityReport(answers).scores).toEqual(calculatePersonalityScores(answers));
  });
});
