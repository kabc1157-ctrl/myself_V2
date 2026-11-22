import { type PersonalityDimension } from "./questions";
import { type PersonalityScoringResult, type ScoreBand } from "./scoring";

export type PersonalityCombination = {
  id: string;
  title: string;
  analysis: string;
  strategy: string;
  dimensions: readonly PersonalityDimension[];
  note: string;
};

type CombinationRule = Omit<PersonalityCombination, "note"> & {
  required: Partial<Record<PersonalityDimension, ScoreBand>>;
};

/**
 * Exploratory hypotheses only: these are not established causal relationships.
 * The order is deterministic. Contradictory answers (adjusted spread >= 3)
 * prevent use of a dimension in a combination.
 */
export const COMBINATION_RULES: readonly CombinationRule[] = [
  {
    id: "openness-high-conscientiousness-low",
    dimensions: ["openness", "conscientiousness"],
    required: { openness: "high", conscientiousness: "low" },
    title: "새로운 시도와 자유로운 진행",
    analysis: "새로운 시도에 흥미를 느끼면서도 계획을 엄격하게 유지하는 방식에는 덜 동의했어요. 시도 자체와 지속 방식은 다를 수 있어요.",
    strategy: "새 목표를 시작할 때 첫 반복 행동과 완료 기준을 한 가지씩 정해 보세요.",
  },
  {
    id: "conscientiousness-high-sensitivity-high",
    dimensions: ["conscientiousness", "emotional_sensitivity"],
    required: { conscientiousness: "high", emotional_sensitivity: "high" },
    title: "책임감과 정서적 반응",
    analysis: "약속과 계획을 중요하게 여기면서 계획 차질에는 정서적으로 민감하게 반응할 수 있어요.",
    strategy: "하루 계획에 조정할 수 있는 여유를 남기고 완료율만으로 하루를 평가하지 마세요.",
  },
  {
    id: "promotion-high-prevention-high",
    dimensions: ["promotion", "prevention"],
    required: { promotion: "high", prevention: "high" },
    title: "성장 욕구와 안정 욕구의 공존",
    analysis: "성취와 발전을 중시하면서도 위험과 실수를 미리 살피려는 응답이 함께 높았어요. 두 동기는 동시에 작용할 수 있어요.",
    strategy: "새 도전의 성장 목표와 허용 가능한 위험 기준을 함께 정해 보세요.",
  },
  {
    id: "time-high-cue-high",
    dimensions: ["time_centered", "cue_centered"],
    required: { time_centered: "high", cue_centered: "high" },
    title: "시작 시간과 행동 계기의 결합",
    analysis: "정해진 시간과 기존 습관에 이어서 시작하는 방식 모두에 높은 동의를 보였어요.",
    strategy: "정해진 시간에 시작하되 직전에 하는 행동을 출발 신호로 연결해 보세요.",
  },
  {
    id: "extraversion-low-agreeableness-high",
    dimensions: ["extraversion", "agreeableness"],
    required: { extraversion: "low", agreeableness: "high" },
    title: "적은 교류 선호와 관계에서의 배려",
    analysis: "교류량은 적게 선호할 수 있지만 관계 속에서는 타인을 배려하는 태도를 중시한다고 답했어요.",
    strategy: "자신에게 적절한 교류 빈도를 정하고 관계마다 필요한 회복 시간을 확보해 보세요.",
  },
  {
    id: "openness-high-promotion-high",
    dimensions: ["openness", "promotion"],
    required: { openness: "high", promotion: "high" },
    title: "새로운 가능성과 성장 동기",
    analysis: "새로운 아이디어를 탐색하면서 발전의 기회에도 동기를 느낀다는 응답이 함께 높았어요.",
    strategy: "새 프로젝트마다 시작 조건과 완료 기준을 구분해 보세요.",
  },
];

export const COMBINATION_DISCLAIMER =
  "성향 조합은 검증된 인과관계가 아니라, 자기이해를 돕는 탐색적 해석입니다.";

export function selectPersonalityCombinations(
  scores: PersonalityScoringResult,
  limit = 3,
): PersonalityCombination[] {
  if (!Number.isInteger(limit) || limit < 0 || limit > 3) {
    throw new RangeError("성향 조합은 최대 세 개까지 선택할 수 있습니다.");
  }
  return COMBINATION_RULES.filter((rule) =>
    Object.entries(rule.required).every(([dimension, band]) => {
      const result = scores.dimensions[dimension as PersonalityDimension];
      return result?.band === band && result.adjustedResponseSpread < 3;
    }),
  ).slice(0, limit).map(({ id, title, analysis, strategy, dimensions }) => ({
    id,
    title,
    analysis,
    strategy,
    dimensions: [...dimensions],
    note: COMBINATION_DISCLAIMER,
  }));
}
