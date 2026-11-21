import {
  ASSESSMENT_ITEMS,
  ASSESSMENT_ITEM_COUNT,
  PERSONALITY_ASSESSMENT_VERSION,
  PERSONALITY_DIMENSIONS,
  type PersonalityDimension,
} from "./questions";

/**
 * App-specific scoring for exploratory self-reflection.
 * Scores are descriptive agreement indices, NOT normed percentiles,
 * a diagnostic assessment, or validated Big Five / RFQ scores.
 */
export const PERSONALITY_SCORING_VERSION = "ieumsae-score-v1" as const;

export type ScoreBand = "low" | "mixed" | "high";
export type DimensionResult = {
  score: number;
  band: ScoreBand;
  itemCount: number;
  adjustedResponseSpread: number;
};
export type PersonalityScoringResult = {
  assessmentVersion: typeof PERSONALITY_ASSESSMENT_VERSION;
  scoringVersion: typeof PERSONALITY_SCORING_VERSION;
  totalItems: number;
  dimensions: Record<PersonalityDimension, DimensionResult>;
};
export type ValidAssessmentAnswers = Record<string, "1" | "2" | "3" | "4" | "5">;

const VALID_IDS = new Set(ASSESSMENT_ITEMS.map((item) => item.id));
const VALID_VALUES = new Set(["1", "2", "3", "4", "5"]);

/**
 * Throws on invalid data rather than guessing answers or allowing incomplete
 * questionnaires to be interpreted as complete. Also validates draft payloads.
 */
export function validateAssessmentAnswers(
  value: unknown,
  options: { allowPartial?: boolean } = {},
): asserts value is ValidAssessmentAnswers {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("검사 답변은 객체 형식이어야 합니다.");
  }
  const entries = Object.entries(value);
  if ((!options.allowPartial && entries.length !== ASSESSMENT_ITEM_COUNT) ||
      (options.allowPartial && entries.length > ASSESSMENT_ITEM_COUNT)) {
    throw new Error("검사 답변의 문항 수가 올바르지 않습니다.");
  }
  for (const [id, response] of entries) {
    if (!VALID_IDS.has(id) || typeof response !== "string" || !VALID_VALUES.has(response)) {
      throw new Error(`올바르지 않은 검사 답변: ${id}`);
    }
  }
  if (!options.allowPartial) {
    for (const item of ASSESSMENT_ITEMS) {
      if (!Object.prototype.hasOwnProperty.call(value, item.id)) {
        throw new Error(`응답하지 않은 문항: ${item.id}`);
      }
    }
  }
}

export function getScoreBand(score: number): ScoreBand {
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new RangeError("성향 점수는 0~100 사이 정수여야 합니다.");
  }
  if (score <= 39) return "low";
  if (score <= 69) return "mixed";
  return "high";
}

/**
 * Raw 1–5 answers become 1–5 adjusted answers (reverse: 6 - raw).
 * For each subscale: Math.round(((mean - 1) / 4) * 100).
 * Rounding happens once, after the mean is calculated.
 */
export function calculatePersonalityScores(value: unknown): PersonalityScoringResult {
  validateAssessmentAnswers(value);

  const dimensions = {} as Record<PersonalityDimension, DimensionResult>;
  for (const dimension of PERSONALITY_DIMENSIONS) {
    const items = ASSESSMENT_ITEMS.filter((item) => item.dimension === dimension);
    // A single response must never masquerade as a multi-item subscale.
    if (items.length < 3) {
      throw new Error(`검사 문항 배분이 부족합니다: ${dimension}`);
    }
    const adjusted = items.map((item) => {
      const raw = Number(value[item.id]);
      return item.reverseScored ? 6 - raw : raw;
    });
    const mean = adjusted.reduce((sum, response) => sum + response, 0) / adjusted.length;
    const score = Math.round(((mean - 1) / 4) * 100);

    dimensions[dimension] = {
      score,
      band: getScoreBand(score),
      itemCount: items.length,
      adjustedResponseSpread: Math.max(...adjusted) - Math.min(...adjusted),
    };
  }

  return {
    assessmentVersion: PERSONALITY_ASSESSMENT_VERSION,
    scoringVersion: PERSONALITY_SCORING_VERSION,
    totalItems: ASSESSMENT_ITEM_COUNT,
    dimensions,
  };
}
