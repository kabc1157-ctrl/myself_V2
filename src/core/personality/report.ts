import {
  PERSONALITY_DIMENSION_LABELS,
  PERSONALITY_DIMENSIONS,
  type PersonalityDimension,
} from "./questions";
import {
  calculatePersonalityScores,
  type DimensionResult,
  type PersonalityScoringResult,
  type ScoreBand,
} from "./scoring";
import {
  interpretDimension,
  type InterpretationRule,
} from "./interpretations";
import {
  COMBINATION_DISCLAIMER,
  selectPersonalityCombinations,
  type PersonalityCombination,
} from "./combinations";

export const PERSONALITY_INTERPRETATION_VERSION = "ieumsae-interpretation-v1" as const;
export const PERSONALITY_REPORT_VERSION = "ieumsae-personality-report-v1" as const;

export type PersonalityDimensionExplanation = {
  dimension: PersonalityDimension;
  label: string;
  score: number;
  band: ScoreBand;
  itemCount: number;
  summary: string;
  lifeMeaning: string;
  observation: string | null;
};

export type PersonalityReportStrategy = {
  area: "routine" | "goal" | "schedule" | "reflection" | "relationship";
  title: string;
  action: string;
};

export type PersonalityReport = {
  reportVersion: typeof PERSONALITY_REPORT_VERSION;
  assessmentVersion: PersonalityScoringResult["assessmentVersion"];
  scoringVersion: PersonalityScoringResult["scoringVersion"];
  interpretationVersion: typeof PERSONALITY_INTERPRETATION_VERSION;
  generatedBy: "predefined_rules";
  aiUsed: false;
  disclaimer: string;
  headline: string;
  sections: {
    summary: {
      title: "나의 성향 요약";
      text: string;
      prominent: Array<{ dimension: PersonalityDimension; label: string; score: number; band: ScoreBand }>;
    };
    personality: {
      title: "나의 성격 특성";
      dimensions: PersonalityDimensionExplanation[];
    };
    motivation: {
      title: "나를 움직이는 동기";
      dimensions: PersonalityDimensionExplanation[];
      interaction: string;
    };
    execution: {
      title: "나의 실행 방식";
      dimensions: PersonalityDimensionExplanation[];
      observation: string;
    };
    connections: {
      title: "성향의 연결";
      items: PersonalityCombination[];
      note: string;
    };
    strengthsAndWatchouts: {
      title: "나의 강점과 주의점";
      possibleStrengths: string[];
      watchouts: string[];
    };
    strategies: {
      title: "나를 위한 생활 전략";
      items: PersonalityReportStrategy[];
    };
  };
};

export type PersonalityReportBundle = {
  scores: PersonalityScoringResult;
  report: PersonalityReport;
};

const CAUTION = "이음새 내부 자기이해를 위한 예비 검사입니다. 점수는 문항에 대한 동의 정도이며 표준화된 성격 수준, 타인과 비교한 백분위 또는 정신건강 진단이 아닙니다. 실제 생활 기록을 통해 함께 살펴보세요.";

const INDEX = new Map(PERSONALITY_DIMENSIONS.map((key, index) => [key, index]));

function explainDimension(
  dimension: PersonalityDimension,
  scores: PersonalityScoringResult,
): PersonalityDimensionExplanation {
  const { score, band, itemCount, adjustedResponseSpread } = scores.dimensions[dimension];
  const rule = interpretDimension(dimension, band);
  return {
    dimension,
    label: PERSONALITY_DIMENSION_LABELS[dimension],
    score,
    band,
    itemCount,
    summary: rule.summary,
    lifeMeaning: rule.lifeMeaning,
    observation: adjustedResponseSpread >= 3
      ? "이 영역 안에서 답변 차이가 크게 나타났어요. 하나의 고정된 성향으로 단정하지 않고 실제 상황별 차이를 살펴보세요."
      : null,
  };
}

function motivationInteraction(scores: PersonalityScoringResult): string {
  const promotion = scores.dimensions.promotion;
  const prevention = scores.dimensions.prevention;
  if (promotion.adjustedResponseSpread >= 3 || prevention.adjustedResponseSpread >= 3) {
    return "동기 관련 문항의 응답 차이가 커요. 성취와 안정 중 무엇이 더 중요한지 단정하기보다 상황별로 관찰해 보세요.";
  }
  if (promotion.band === "high" && prevention.band === "high") {
    return "성취와 성장에서 동기를 얻으면서 실수 예방과 안정도 함께 중요하게 여긴다는 응답이에요. 두 동기는 서로 배타적이지 않아요.";
  }
  if (promotion.band === "low" && prevention.band === "low") {
    return "성취와 위험 방지 모두 주된 동기라는 응답은 적었어요. 관계, 흥미, 일상의 의미 등 다른 동기를 실제 기록에서 찾아보세요.";
  }
  if (promotion.band === "high" && prevention.band === "low") {
    return "성장 기회에 관한 응답이 높고 위험 방지 동기에 대한 응답은 낮았어요. 새로운 도전을 시작할 때 꼭 필요한 확인 기준도 함께 마련해 보세요.";
  }
  if (promotion.band === "low" && prevention.band === "high") {
    return "성과보다는 책임과 안정에 관한 응답이 상대적으로 높았어요. 지속 가능한 목표의 형태를 찾아보세요.";
  }
  return "성취와 안정에 대한 응답은 별도의 두 점수로 해석해요. 어느 한쪽만 선택해야 하는 성향은 아니에요.";
}

function executionObservation(scores: PersonalityScoringResult): string {
  const keys: PersonalityDimension[] = ["time_centered", "cue_centered", "flexible_execution"];
  if (keys.some((key) => scores.dimensions[key].adjustedResponseSpread >= 3)) {
    return "생활 실행 문항 안에서 답변 차이가 큰 영역이 있어요. 시간표·행동 계기·계획 조정 방법을 각각 시도하고 실제 달성률을 비교해 보세요.";
  }
  if (scores.dimensions.time_centered.band === "high" && scores.dimensions.cue_centered.band === "high") {
    return "고정된 시작 시간과 기존 행동을 단서로 삼는 방법을 함께 시험해 볼 수 있어요. 실제 실행 기록을 통해 효과를 확인해 보세요.";
  }
  return "검사 응답만으로 가장 효과적인 실행 방법을 확정할 수 없어요. 루틴·일정 기록에서 실천한 날과 어려웠던 날을 함께 살펴보세요.";
}

function prominentDimensions(scores: PersonalityScoringResult): PersonalityDimension[] {
  const ranked = [...PERSONALITY_DIMENSIONS].sort((a, b) => {
    const left = scores.dimensions[a];
    const right = scores.dimensions[b];
    const leftConsistent = left.adjustedResponseSpread < 3 ? 1 : 0;
    const rightConsistent = right.adjustedResponseSpread < 3 ? 1 : 0;
    if (rightConsistent !== leftConsistent) return rightConsistent - leftConsistent;
    const leftDistinct = left.band === "mixed" ? 0 : 1;
    const rightDistinct = right.band === "mixed" ? 0 : 1;
    if (rightDistinct !== leftDistinct) return rightDistinct - leftDistinct;
    const leftDistance = Math.abs(left.score - 50);
    const rightDistance = Math.abs(right.score - 50);
    if (leftDistance !== rightDistance) return rightDistance - leftDistance;
    return (INDEX.get(a) ?? 0) - (INDEX.get(b) ?? 0);
  });
  // Avoid forced personality claims when every dimension sits in a mixed band.
  const pronounced = ranked.filter((key) =>
    scores.dimensions[key].band !== "mixed" &&
    scores.dimensions[key].adjustedResponseSpread < 3,
  );
  return (pronounced.length ? pronounced : ranked).slice(0, 3);
}

function buildSummary(
  scores: PersonalityScoringResult,
  prominent: PersonalityDimension[],
): PersonalityReport["sections"]["summary"] {
  const highlights = prominent.map((dimension) => {
    const { score, band } = scores.dimensions[dimension];
    return { dimension, label: PERSONALITY_DIMENSION_LABELS[dimension], score, band };
  });
  const rules = prominent.map((dimension) => interpretDimension(dimension, scores.dimensions[dimension].band));
  const hasStrongSignal = prominent.some((dimension) =>
    scores.dimensions[dimension].band !== "mixed" &&
    scores.dimensions[dimension].adjustedResponseSpread < 3,
  );
  const headline = hasStrongSignal
    ? `응답에서 두드러진 모습: ${rules.slice(0, 2).map((rule) => rule.shortLabel).join(" · ")}`
    : "상황에 따라 달라지는 나의 성향을 살펴보기";
  const texts = rules.slice(0, 3).map((rule) => rule.summary);
  return {
    title: "나의 성향 요약",
    text: `${texts.join(" ")} 다만 검사 응답은 출발점일 뿐이며, 실제 생활에서 언제 이런 모습이 나타나는지는 기록을 통해 확인할 필요가 있어요.`,
    prominent: highlights,
  };
}

function getStrengthsAndWatchouts(
  scores: PersonalityScoringResult,
  prominent: PersonalityDimension[],
): PersonalityReport["sections"]["strengthsAndWatchouts"] {
  // Select 2–3 dimensions, regardless of whether any score is extreme.
  const selected = prominent.slice(0, 3);
  const strengths = selected.map((key) => interpretDimension(key, scores.dimensions[key].band).possibleStrength);
  const watchouts = selected.map((key) => interpretDimension(key, scores.dimensions[key].band).watchout);
  return {
    title: "나의 강점과 주의점",
    possibleStrengths: strengths,
    watchouts,
  };
}

function getStrategies(scores: PersonalityScoringResult): PersonalityReportStrategy[] {
  const choose = (key: PersonalityDimension): InterpretationRule =>
    interpretDimension(key, scores.dimensions[key].band);

  const strategies: PersonalityReportStrategy[] = [
    { area: "routine", title: "루틴", action: choose("cue_centered").action },
    { area: "goal", title: "목표", action: choose("promotion").action },
    { area: "schedule", title: "일정", action: choose("time_centered").action },
    {
      area: "reflection",
      title: "회고",
      action: scores.dimensions.emotional_sensitivity.band === "high"
        ? choose("emotional_sensitivity").action
        : choose("flexible_execution").action,
    },
  ];
  const social = scores.dimensions.extraversion.band !== "mixed"
    ? "extraversion"
    : scores.dimensions.agreeableness.band !== "mixed"
      ? "agreeableness"
      : null;
  if (social !== null) {
    strategies.push({
      area: "relationship",
      title: "관계",
      action: choose(social).action,
    });
  }
  return strategies;
}

/**
 * Only the raw answers are accepted. The score snapshot and all seven report
 * sections are recomputed in trusted application code, never from client scores
 * or generated AI text. Persistence and final submission belong to P4.
 */
export function createPersonalityReport(answers: unknown): PersonalityReportBundle {
  const scores = calculatePersonalityScores(answers);
  const prominent = prominentDimensions(scores);
  const explain = (key: PersonalityDimension) => explainDimension(key, scores);

  const report: PersonalityReport = {
    reportVersion: PERSONALITY_REPORT_VERSION,
    assessmentVersion: scores.assessmentVersion,
    scoringVersion: scores.scoringVersion,
    interpretationVersion: PERSONALITY_INTERPRETATION_VERSION,
    generatedBy: "predefined_rules",
    aiUsed: false,
    disclaimer: CAUTION,
    headline: buildSummary(scores, prominent).headline,
    sections: {
      summary: buildSummary(scores, prominent),
      personality: {
        title: "나의 성격 특성",
        dimensions: PERSONALITY_DIMENSIONS.slice(0, 5).map(explain),
      },
      motivation: {
        title: "나를 움직이는 동기",
        dimensions: PERSONALITY_DIMENSIONS.slice(5, 7).map(explain),
        interaction: motivationInteraction(scores),
      },
      execution: {
        title: "나의 실행 방식",
        dimensions: PERSONALITY_DIMENSIONS.slice(7).map(explain),
        observation: executionObservation(scores),
      },
      connections: {
        title: "성향의 연결",
        items: selectPersonalityCombinations(scores, 3),
        note: COMBINATION_DISCLAIMER,
      },
      strengthsAndWatchouts: getStrengthsAndWatchouts(scores, prominent),
      strategies: {
        title: "나를 위한 생활 전략",
        items: getStrategies(scores),
      },
    },
  };
  return { scores, report };
}
