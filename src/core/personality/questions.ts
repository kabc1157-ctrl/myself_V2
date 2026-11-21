/**
 * IEUMSAE 35-item provisional self-report questionnaire.
 *
 * All prompts are app-authored exploratory questions, NOT validated translations
 * or normed Mini-IPIP / RFQ instruments. The Big Five and regulatory-focus
 * labels describe intended constructs only.
 *
 * Each of ten dimensions has at least three items: 20 Big Five, 6 motivation,
 * 9 execution. Reverse-worded items are design choices, not psychometrically
 * validated item keys. Never treat these scores as clinical tests, percentiles,
 * or comparisons with other users.
 *
 * Altering a question's wording/order/key requires a new assessment version.
 */
export type PersonalityDimension =
  | "openness" | "conscientiousness" | "extraversion"
  | "agreeableness" | "emotional_sensitivity"
  | "promotion" | "prevention"
  | "time_centered" | "cue_centered" | "flexible_execution";

export type AssessmentItem = {
  id: string;
  text: string;
  dimension: PersonalityDimension;
  reverseScored: boolean;
};

export const PERSONALITY_ASSESSMENT_VERSION = "ieumsae-35-provisional-v2" as const;

export const PERSONALITY_DIMENSION_LABELS: Record<PersonalityDimension, string> = {
  "openness": "개방성",
  "conscientiousness": "성실성",
  "extraversion": "외향성",
  "agreeableness": "친화성",
  "emotional_sensitivity": "정서적 민감성",
  "promotion": "향상초점",
  "prevention": "예방초점",
  "time_centered": "시간중심",
  "cue_centered": "계기중심",
  "flexible_execution": "유연한 실행"
};

export const PERSONALITY_DIMENSIONS: readonly PersonalityDimension[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "emotional_sensitivity",
  "promotion",
  "prevention",
  "time_centered",
  "cue_centered",
  "flexible_execution",
] as const;

export const ASSESSMENT_ITEMS: readonly AssessmentItem[] = [
  { id: "q1", text: "새로운 주제나 아이디어를 알아보는 일이 즐겁다.", dimension: "openness", reverseScored: false },
  { id: "q2", text: "익숙한 방법과 다른 접근법을 시도하는 것을 좋아한다.", dimension: "openness", reverseScored: false },
  { id: "q3", text: "새로운 방법보다는 늘 해오던 방법만 선택하고 싶다.", dimension: "openness", reverseScored: true },
  { id: "q4", text: "다른 관점을 상상해 보는 일에는 별로 흥미가 없다.", dimension: "openness", reverseScored: true },
  { id: "q5", text: "해야 할 일을 미리 정리하고 순서를 세우는 편이다.", dimension: "conscientiousness", reverseScored: false },
  { id: "q6", text: "정한 약속이나 마감을 지키려고 꾸준히 노력한다.", dimension: "conscientiousness", reverseScored: false },
  { id: "q7", text: "중요한 일이라도 마무리를 미루는 경우가 잦다.", dimension: "conscientiousness", reverseScored: true },
  { id: "q8", text: "준비 없이 일을 시작해 놓치는 것이 자주 생긴다.", dimension: "conscientiousness", reverseScored: true },
  { id: "q9", text: "사람들과 함께 활동할 때 활력을 느낀다.", dimension: "extraversion", reverseScored: false },
  { id: "q10", text: "모임에서 먼저 대화를 시작하는 편이다.", dimension: "extraversion", reverseScored: false },
  { id: "q11", text: "사람들과 오래 어울리면 에너지가 금방 소진된다.", dimension: "extraversion", reverseScored: true },
  { id: "q12", text: "여럿이 함께하는 활동보다 혼자 하는 활동을 훨씬 선호한다.", dimension: "extraversion", reverseScored: true },
  { id: "q13", text: "의견이 달라도 상대방의 입장을 이해하려고 한다.", dimension: "agreeableness", reverseScored: false },
  { id: "q14", text: "함께 일할 때 서로 협력하는 과정을 중요하게 생각한다.", dimension: "agreeableness", reverseScored: false },
  { id: "q15", text: "의견이 부딪힐 때 상대의 사정은 별로 고려하지 않는 편이다.", dimension: "agreeableness", reverseScored: true },
  { id: "q16", text: "다른 사람의 감정을 헤아리는 일이 내게 중요하지 않다.", dimension: "agreeableness", reverseScored: true },
  { id: "q17", text: "예상과 다른 일이 생기면 걱정이 오래 남는 편이다.", dimension: "emotional_sensitivity", reverseScored: false },
  { id: "q18", text: "작은 실수에도 마음이 쉽게 흔들리는 편이다.", dimension: "emotional_sensitivity", reverseScored: false },
  { id: "q19", text: "예상하지 못한 상황에서도 비교적 차분함을 유지한다.", dimension: "emotional_sensitivity", reverseScored: true },
  { id: "q20", text: "스트레스를 받아도 감정이 빠르게 안정되는 편이다.", dimension: "emotional_sensitivity", reverseScored: true },
  { id: "q21", text: "목표를 이루었을 때 얻을 성장과 성취를 먼저 떠올린다.", dimension: "promotion", reverseScored: false },
  { id: "q22", text: "조금씩 발전하고 있다는 느낌이 행동을 지속하게 한다.", dimension: "promotion", reverseScored: false },
  { id: "q23", text: "새로운 성취 가능성만으로는 행동할 의욕이 별로 생기지 않는다.", dimension: "promotion", reverseScored: true },
  { id: "q24", text: "계획을 세울 때 발생할 수 있는 문제부터 살펴본다.", dimension: "prevention", reverseScored: false },
  { id: "q25", text: "실수를 예방할 수 있는 준비가 되어야 안심하고 시작한다.", dimension: "prevention", reverseScored: false },
  { id: "q26", text: "실수나 위험을 미리 점검하는 일에는 크게 관심이 없다.", dimension: "prevention", reverseScored: true },
  { id: "q27", text: "정해진 시작 시간이 있으면 행동을 시작하기 쉽다.", dimension: "time_centered", reverseScored: false },
  { id: "q28", text: "중요한 일을 시간표에 배치하면 실천하기 편하다.", dimension: "time_centered", reverseScored: false },
  { id: "q29", text: "하루의 시작 시간을 정해 두는 방식은 내게 별 도움이 되지 않는다.", dimension: "time_centered", reverseScored: true },
  { id: "q30", text: "기존 습관을 끝낸 뒤 다음 행동을 연결하면 실천하기 쉽다.", dimension: "cue_centered", reverseScored: false },
  { id: "q31", text: "매일 하는 행동을 기준으로 다음 루틴을 연결하면 실행이 수월하다.", dimension: "cue_centered", reverseScored: false },
  { id: "q32", text: "어떤 일을 마친 직후 다음 행동을 이어서 시작하는 방식은 내게 잘 맞지 않는다.", dimension: "cue_centered", reverseScored: true },
  { id: "q33", text: "계획이 틀어지면 방법이나 순서를 조정해 목표를 이어가는 편이다.", dimension: "flexible_execution", reverseScored: false },
  { id: "q34", text: "예상치 못한 일이 생기면 계획을 수정해 현실적으로 다시 시작한다.", dimension: "flexible_execution", reverseScored: false },
  { id: "q35", text: "처음 정한 계획이 어긋나면 다른 방법으로 이어가기가 어렵다.", dimension: "flexible_execution", reverseScored: true },
];

export const ASSESSMENT_SCALE = [
  { value: "1", label: "전혀 아니다" },
  { value: "2", label: "아닌 편이다" },
  { value: "3", label: "보통이다" },
  { value: "4", label: "그런 편이다" },
  { value: "5", label: "매우 그렇다" },
] as const;

export const ASSESSMENT_ITEM_COUNT = ASSESSMENT_ITEMS.length;

export function assessmentGroup(index: number): { title: string; description: string } {
  if (index < 20) return { title: "01. 성격 특성", description: "평소의 생각과 행동에 가장 가까운 응답을 골라주세요." };
  if (index < 26) return { title: "02. 행동 동기", description: "어떤 상황에서 행동할 힘을 얻는지 돌아보세요." };
  return { title: "03. 생활 실행 방식", description: "실제 생활에서 더 자주 활용하는 방식을 생각해 보세요." };
}
