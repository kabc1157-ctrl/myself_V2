import { describe, expect, it } from "vitest";
import { ASSESSMENT_ITEMS, PERSONALITY_DIMENSIONS } from "./questions";
import {
  calculatePersonalityScores,
  getScoreBand,
  validateAssessmentAnswers,
} from "./scoring";

function answersByAdjustedScore(adjusted: "1" | "3" | "5") {
  const desired = Number(adjusted);
  return Object.fromEntries(ASSESSMENT_ITEMS.map((item) =>
    [item.id, String(item.reverseScored ? 6 - desired : desired)],
  ));
}

describe("personality scoring", () => {
  it("calculates 50 for neutral answers across all ten dimensions", () => {
    const result = calculatePersonalityScores(answersByAdjustedScore("3"));
    expect(result.totalItems).toBe(35);
    expect(Object.keys(result.dimensions)).toHaveLength(10);
    for (const dimension of PERSONALITY_DIMENSIONS) {
      expect(result.dimensions[dimension].score).toBe(50);
      expect(result.dimensions[dimension].band).toBe("mixed");
      expect(result.dimensions[dimension].itemCount).toBeGreaterThanOrEqual(3);
      expect(result.dimensions[dimension].adjustedResponseSpread).toBe(0);
    }
  });

  it("reverse-scores the flagged questions and respects both endpoints", () => {
    const high = calculatePersonalityScores(answersByAdjustedScore("5"));
    const low = calculatePersonalityScores(answersByAdjustedScore("1"));
    for (const dimension of PERSONALITY_DIMENSIONS) {
      expect(high.dimensions[dimension].score).toBe(100);
      expect(high.dimensions[dimension].band).toBe("high");
      expect(low.dimensions[dimension].score).toBe(0);
      expect(low.dimensions[dimension].band).toBe("low");
    }
  });

  it("rounds once after averaging adjusted responses", () => {
    const input = answersByAdjustedScore("3");
    input.q1 = "5";
    const scores = calculatePersonalityScores(input);
    // Openness: (5+3+3+3)/4 = 3.5 => (3.5-1)*25 = 62.5 => 63.
    expect(scores.dimensions.openness.score).toBe(63);
    expect(scores.dimensions.openness.adjustedResponseSpread).toBe(2);
    expect(scores.dimensions.conscientiousness.score).toBe(50);
  });

  it("keeps promotion and prevention independent", () => {
    const input = answersByAdjustedScore("3");
    for (const item of ASSESSMENT_ITEMS) {
      if (item.dimension === "promotion") {
        input[item.id] = String(item.reverseScored ? 1 : 5);
      }
      if (item.dimension === "prevention") {
        input[item.id] = String(item.reverseScored ? 5 : 1);
      }
    }
    const result = calculatePersonalityScores(input);
    expect(result.dimensions.promotion.score).toBe(100);
    expect(result.dimensions.prevention.score).toBe(0);
  });

  it.each([
    [0, "low"], [39, "low"], [40, "mixed"],
    [69, "mixed"], [70, "high"], [100, "high"],
  ] as const)("assigns %i to %s", (score, band) => {
    expect(getScoreBand(score)).toBe(band);
  });

  it.each([-1, 101, 39.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid score of %s", (score) => {
      expect(() => getScoreBand(score)).toThrow();
    },
  );

  it("blocks missing, extra, malformed, and wrong-type responses", () => {
    const valid = answersByAdjustedScore("3");
    expect(() => calculatePersonalityScores(valid)).not.toThrow();
    expect(() => calculatePersonalityScores({ ...valid, q35: undefined })).toThrow();
    const { q35: _omitted, ...incomplete } = valid;
    expect(() => calculatePersonalityScores(incomplete)).toThrow();
    expect(() => calculatePersonalityScores({ ...valid, q36: "3" })).toThrow();
    expect(() => calculatePersonalityScores({ ...valid, q1: "6" })).toThrow();
    expect(() => calculatePersonalityScores({ ...valid, q1: 5 })).toThrow();
    expect(() => calculatePersonalityScores({ ...valid, q1: "3.0" })).toThrow();
    expect(() => calculatePersonalityScores(null)).toThrow();
    expect(() => calculatePersonalityScores([])).toThrow();
  });

  it("permits only valid partial drafts without scoring them", () => {
    expect(() => validateAssessmentAnswers({}, { allowPartial: true })).not.toThrow();
    expect(() => validateAssessmentAnswers({ q2: "5" }, { allowPartial: true })).not.toThrow();
    expect(() => validateAssessmentAnswers({ q2: "0" }, { allowPartial: true })).toThrow();
    expect(() => validateAssessmentAnswers({ q2: "5", q99: "1" }, { allowPartial: true })).toThrow();
    expect(() => calculatePersonalityScores({ q2: "5" })).toThrow();
  });

  it("does not mutate the original answers", () => {
    const input = Object.freeze(answersByAdjustedScore("3"));
    const before = JSON.stringify(input);
    calculatePersonalityScores(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
