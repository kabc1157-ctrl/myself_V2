import { PERSONALITY_DIMENSIONS, PERSONALITY_DIMENSION_LABELS, type PersonalityDimension } from "./questions";
import { calculatePersonalityScores, type PersonalityScoringResult } from "./scoring";
import { interpretDimension } from "./interpretations";
import { selectPersonalityCombinations, type PersonalityCombination } from "./combinations";

export const REPORT_VERSION_V2 = "ieumsae-personality-report-v2" as const;
export const INTERPRETATION_VERSION_V2 = "ieumsae-interpretation-v2" as const;
type Evidence = { dimension: PersonalityDimension; label: string; score: number; band: string };
type Insight = { title: string; evidence: Evidence[]; meaning: string; action: string };

export type PersonalityReportV2 = {
  reportVersion: typeof REPORT_VERSION_V2;
  interpretationVersion: typeof INTERPRETATION_VERSION_V2;
  assessmentVersion: string;
  scoringVersion: string;
  generatedBy: "predefined_rules";
  aiUsed: false;
  headline: string;
  disclaimer: string;
  sections: {
    summary: { title: string; text: string; evidence: Evidence[]; strategy: string };
    behavior: { title: string; items: Insight[] };
    personality: { title: string; items: Insight[] };
    motivationExecution: { title: string; items: Insight[]; synthesis: string };
    connections: { title: string; items: PersonalityCombination[]; note: string };
    strengths: { title: string; items: Insight[] };
    strategies: { title: string; items: Insight[]; note: string };
  };
};

const reliable = (scores: PersonalityScoringResult, key: PersonalityDimension) =>
  scores.dimensions[key].band !== "mixed" && scores.dimensions[key].adjustedResponseSpread < 3;

const evidence = (scores: PersonalityScoringResult, key: PersonalityDimension): Evidence => ({
  dimension: key, label: PERSONALITY_DIMENSION_LABELS[key],
  score: scores.dimensions[key].score, band: scores.dimensions[key].band,
});

const pair = (scores: PersonalityScoringResult, a: PersonalityDimension, b: PersonalityDimension,
  title: string, meaning: string, action: string): Insight | null =>
  reliable(scores, a) && reliable(scores, b) ? {
    title, evidence: [evidence(scores, a), evidence(scores, b)], meaning, action,
  } : null;

function exploratoryConnections(scores: PersonalityScoringResult): PersonalityCombination[] {
  const selected = selectPersonalityCombinations(scores, 3);
  if (selected.length) return selected;
  const candidates = [
    pair(scores, "cue_centered", "flexible_execution", "시작 계기와 실행 조정",
      "기존 행동을 시작 계기로 활용하는 응답과 방법을 조정하는 응답이 함께 뚜렷해요. 두 선호를 함께 시험할 수 있어요.",
      "시작 계기는 유지하고, 일정이 달라지면 수행 방법만 바꿔 보세요."),
    pair(scores, "conscientiousness", "flexible_execution", "계획과 조정",
      "계획을 챙기는 응답과 실행 방법을 조정하는 응답이 함께 뚜렷해요.",
      "완료 기준은 정해 두고 진행 순서는 바꿀 수 있게 두세요."),
    pair(scores, "promotion", "prevention", "성장과 안정의 동시 고려",
      "성장과 위험 관리에 대한 응답이 모두 뚜렷해요. 두 동기는 동시에 고려할 수 있어요.",
      "새 목표의 기대 성과와 확인할 위험 한 가지를 같이 적어 보세요."),
  ].filter((item): item is Insight => item !== null);
  return candidates.slice(0, 2).map((item, index) => ({
    id: `exploratory-${index}`, title: item.title, analysis: item.meaning,
    strategy: item.action, dimensions: item.evidence.map(x => x.dimension),
    note: "응답에 근거한 탐색적 연결이며 검증된 인과관계는 아닙니다.",
  }));
}

export function createPersonalityReportV2(answers: unknown): { scores: PersonalityScoringResult; report: PersonalityReportV2 } {
  const scores = calculatePersonalityScores(answers);
  const cue = scores.dimensions.cue_centered;
  const flex = scores.dimensions.flexible_execution;
  const time = scores.dimensions.time_centered;
  const cueFlex = reliable(scores, "cue_centered") && reliable(scores, "flexible_execution") && cue.band === "high" && flex.band === "high";
  const timeCue = reliable(scores, "time_centered") && reliable(scores, "cue_centered") && time.band === "high" && cue.band === "high";
  const headline = cueFlex ? "시작 계기는 일정하게, 실행 방법은 유연하게" :
    timeCue ? "시작 시간과 행동 계기를 함께 활용하기" :
    cue.band === "low" && reliable(scores, "cue_centered") ? "기존 습관보다 별도의 시작 신호를 활용하기" :
    time.band === "high" && reliable(scores, "time_centered") ? "시작 시간을 정해 실행의 발판 만들기" :
    "나의 응답에 맞춰 실행 방식을 찾아보기";
  const start = cueFlex ? "익숙한 행동을 새 활동의 출발점으로 활용하고, 실행 과정에서는 상황에 맞게 방법을 바꾸는 방식에 높은 동의를 보였어요." :
    `${interpretDimension("cue_centered", cue.band).summary} ${interpretDimension("flexible_execution", flex.band).summary}`;
  const startAction = cueFlex ? "시작 계기는 고정하고, 실행 방법은 유연하게 조정해 보세요." :
    `${interpretDimension("cue_centered", cue.band).action} ${interpretDimension("flexible_execution", flex.band).action}`;
  const behavior: Insight[] = [
    { title: "시작할 때", evidence: [evidence(scores, "cue_centered"), evidence(scores, "time_centered")],
      meaning: timeCue ? "정해 둔 시각과 그 직전의 익숙한 행동을 시작 신호로 함께 쓸 수 있어요." :
        `${interpretDimension("cue_centered", cue.band).lifeMeaning} ${interpretDimension("time_centered", time.band).lifeMeaning}`,
      action: timeCue ? "예를 들어 8시에 양치한 뒤 10분간 첫 작업을 시작해 보세요." : interpretDimension("cue_centered", cue.band).action },
    { title: "계획을 조정할 때", evidence: [evidence(scores, "flexible_execution"), evidence(scores, "conscientiousness")],
      meaning: `${interpretDimension("flexible_execution", flex.band).lifeMeaning} ${interpretDimension("conscientiousness", scores.dimensions.conscientiousness.band).lifeMeaning}`,
      action: flex.band === "high" ? "일정이 밀려도 완료 기준은 남겨 두고 실행 순서나 시간을 바꿔 보세요." : interpretDimension("flexible_execution", flex.band).action },
    { title: "동기를 만들 때", evidence: [evidence(scores, "promotion"), evidence(scores, "prevention")],
      meaning: `${interpretDimension("promotion", scores.dimensions.promotion.band).lifeMeaning} ${interpretDimension("prevention", scores.dimensions.prevention.band).lifeMeaning}`,
      action: scores.dimensions.promotion.band === "high" ? "프로젝트에 이번 주의 작은 진전 한 가지를 적어 보세요." : "해야 하는 이유와 지킬 기준을 각각 한 줄씩 적어 보세요." },
  ];
  const item = (key: PersonalityDimension): Insight => {
    const rule = interpretDimension(key, scores.dimensions[key].band);
    return { title: PERSONALITY_DIMENSION_LABELS[key], evidence: [evidence(scores, key)],
      meaning: `${rule.summary} ${rule.lifeMeaning} 주의해서 볼 점: ${rule.watchout}`,
      action: rule.action };
  };
  const connections = exploratoryConnections(scores);
  const confident = PERSONALITY_DIMENSIONS.filter(key => reliable(scores, key)).slice(0, 3);
  const strengths = confident.map(key => {
    const rule = interpretDimension(key, scores.dimensions[key].band);
    return { title: PERSONALITY_DIMENSION_LABELS[key], evidence: [evidence(scores, key)],
      meaning: `${rule.possibleStrength} 도움이 될 수 있는 상황과 불편한 상황을 비교해 보세요. ${rule.watchout}`,
      action: rule.action };
  });
  const strategies: Insight[] = [
    { title: "루틴", evidence: [evidence(scores, "cue_centered"), evidence(scores, "flexible_execution")],
      meaning: "시작 단서와 다시 이어갈 방법을 나누어 준비해요.",
      action: cue.band === "high" ? "식사나 양치 직후 10분 루틴을 시작하고, 하루 빠졌다면 다음 같은 계기에 다시 시작해 보세요." : "루틴의 시작 신호를 체크리스트에 적고, 하루 빠졌다면 다음 날 첫 항목만 다시 해 보세요." },
    { title: "일정", evidence: [evidence(scores, "time_centered"), evidence(scores, "flexible_execution")],
      meaning: "시간을 고정할 일과 순서를 바꿀 일을 구분해요.",
      action: time.band === "high" ? "핵심 일정 한 개의 시작 시각을 고정하고, 변동이 생기면 나머지 일정의 순서만 조정해 보세요." : "시간을 고정해야 하는 약속만 달력에 넣고 나머지는 실행 순서로 적어 보세요." },
    { title: "목표·프로젝트", evidence: [evidence(scores, "promotion"), evidence(scores, "conscientiousness")],
      meaning: "완료 기준과 실행 방법을 분리해요.",
      action: "프로젝트에 이번 주 완료 기준 한 가지를 적고, 오늘 할 수 있는 10분짜리 TODO로 나눠 보세요." },
    { title: "회고", evidence: [evidence(scores, "emotional_sensitivity"), evidence(scores, "flexible_execution")],
      meaning: "결과와 그날의 조건을 함께 기록해요.",
      action: "하루 끝에 시작을 도운 계기, 계획이 바뀐 순간, 다음번 바꿀 방법을 각각 한 줄씩 적어 보세요." },
  ];
  const report: PersonalityReportV2 = {
    reportVersion: REPORT_VERSION_V2, interpretationVersion: INTERPRETATION_VERSION_V2,
    assessmentVersion: scores.assessmentVersion, scoringVersion: scores.scoringVersion,
    generatedBy: "predefined_rules", aiUsed: false, headline,
    disclaimer: "이음새 내부 자기이해를 위한 예비 자기보고 검사입니다. 점수는 응답 동의 지표이며 백분위나 진단이 아닙니다. 아래 연결과 전략은 검증된 개인 맞춤 처방이 아닌 탐색적 제안입니다.",
    sections: {
      summary: { title: "한 문장으로 보는 나", text: start, evidence: [evidence(scores, "cue_centered"), evidence(scores, "flexible_execution"), evidence(scores, "time_centered")], strategy: startAction },
      behavior: { title: "나는 왜 이렇게 행동할까?", items: behavior },
      personality: { title: "나의 성격 특성", items: PERSONALITY_DIMENSIONS.slice(0, 5).map(item) },
      motivationExecution: { title: "나를 움직이는 동기와 실행 방식", items: PERSONALITY_DIMENSIONS.slice(5).map(item),
        synthesis: timeCue ? "시간과 행동 계기를 함께 시작 신호로 쓸 수 있어요. 시작 시간에 기존 행동을 연결해 보세요." : startAction },
      connections: { title: "나의 성향이 만나는 지점", items: connections,
        note: connections.length ? "응답에 근거한 탐색적 연결이에요." : "뚜렷하고 일관된 두 영역의 연결이 적어 조합을 단정하지 않았어요. 시작 계기와 계획 조정에 대한 응답을 따로 비교해 보세요." },
      strengths: { title: "내가 잘 활용할 수 있는 점과 주의할 점", items: strengths },
      strategies: { title: "나에게 맞는 생활 설계", items: strategies,
        note: "실천 전략은 응답에서 도출한 제안이며 효과가 확인된 개인 맞춤 처방은 아닙니다." },
    },
  };
  return { scores, report };
}

export function deriveStoredPersonalityReportV2(answers: unknown, savedScores: unknown): PersonalityReportV2 {
  const result = createPersonalityReportV2(answers);
  const stored = savedScores as Partial<PersonalityScoringResult> | null;
  if (!stored || stored.assessmentVersion !== result.scores.assessmentVersion ||
      stored.scoringVersion !== result.scores.scoringVersion || stored.totalItems !== result.scores.totalItems ||
      !stored.dimensions || PERSONALITY_DIMENSIONS.some(key => {
        const expected = result.scores.dimensions[key];
        const actual = stored.dimensions?.[key];
        return !actual || actual.score !== expected.score || actual.band !== expected.band ||
          actual.itemCount !== expected.itemCount || actual.adjustedResponseSpread !== expected.adjustedResponseSpread;
      })) {
    throw new Error("저장된 검사 점수와 답변이 일치하지 않습니다.");
  }
  return result.report;
}
