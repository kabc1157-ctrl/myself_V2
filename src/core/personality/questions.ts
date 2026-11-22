export type PersonalityQuestion = { id: string; text: string; dimension: string; reverseScored: boolean };

export const ASSESSMENT_ITEMS: readonly PersonalityQuestion[] = [
  ["새로운 주제나 아이디어를 알아보는 일이 즐겁다.", "openness", false], ["익숙한 방법과 다른 접근법을 시도하는 것을 좋아한다.", "openness", false], ["새로운 방법보다는 늘 해오던 방법만 선택하고 싶다.", "openness", true], ["다른 관점을 상상해 보는 일에는 별로 흥미가 없다.", "openness", true],
  ["해야 할 일을 미리 정리하고 순서를 세우는 편이다.", "conscientiousness", false], ["정한 약속이나 마감을 지키려고 꾸준히 노력한다.", "conscientiousness", false], ["중요한 일이라도 마무리를 미루는 경우가 잦다.", "conscientiousness", true], ["준비 없이 일을 시작해 놓치는 것이 자주 생긴다.", "conscientiousness", true],
  ["사람들과 함께 활동할 때 활력을 느낀다.", "extraversion", false], ["모임에서 먼저 대화를 시작하는 편이다.", "extraversion", false], ["사람들과 오래 어울리면 에너지가 금방 소진된다.", "extraversion", true], ["여럿이 함께하는 활동보다 혼자 하는 활동을 훨씬 선호한다.", "extraversion", true],
  ["의견이 달라도 상대방의 입장을 이해하려고 한다.", "agreeableness", false], ["함께 일할 때 서로 협력하는 과정을 중요하게 생각한다.", "agreeableness", false], ["의견이 부딪힐 때 상대의 사정은 별로 고려하지 않는 편이다.", "agreeableness", true], ["다른 사람의 감정을 헤아리는 일이 내게 중요하지 않다.", "agreeableness", true],
  ["예상과 다른 일이 생기면 걱정이 오래 남는 편이다.", "emotional_sensitivity", false], ["작은 실수에도 마음이 쉽게 흔들리는 편이다.", "emotional_sensitivity", false], ["예상하지 못한 상황에서도 비교적 차분함을 유지한다.", "emotional_sensitivity", true], ["스트레스를 받아도 감정이 빠르게 안정되는 편이다.", "emotional_sensitivity", true],
  ["목표를 이루었을 때 얻을 성장과 성취를 먼저 떠올린다.", "promotion", false], ["조금씩 발전하고 있다는 느낌이 행동을 지속하게 한다.", "promotion", false], ["새로운 성취 가능성만으로는 행동할 의욕이 별로 생기지 않는다.", "promotion", true],
  ["계획을 세울 때 발생할 수 있는 문제부터 살펴본다.", "prevention", false], ["실수를 예방할 수 있는 준비가 되어야 안심하고 시작한다.", "prevention", false], ["실수나 위험을 미리 점검하는 일에는 크게 관심이 없다.", "prevention", true],
  ["정해진 시작 시간이 있으면 행동을 시작하기 쉽다.", "time_centered", false], ["중요한 일을 시간표에 배치하면 실천하기 편하다.", "time_centered", false], ["하루의 시작 시간을 정해 두는 방식은 내게 별 도움이 되지 않는다.", "time_centered", true],
  ["기존 습관을 끝낸 뒤 다음 행동을 연결하면 실천하기 쉽다.", "cue_centered", false], ["매일 하는 행동을 기준으로 다음 루틴을 연결하면 실행이 수월하다.", "cue_centered", false], ["어떤 일을 마친 직후 다음 행동을 이어서 시작하는 방식은 내게 잘 맞지 않는다.", "cue_centered", true],
  ["계획이 틀어지면 방법이나 순서를 조정해 목표를 이어가는 편이다.", "flexible_execution", false], ["예상치 못한 일이 생기면 계획을 수정해 현실적으로 다시 시작한다.", "flexible_execution", false], ["처음 정한 계획이 어긋나면 다른 방법으로 이어가기가 어렵다.", "flexible_execution", true],
].map((item, index) => { const [text, dimension, reverseScored] = item as [string, string, boolean]; return { id: `q${index + 1}`, text, dimension, reverseScored }; });

export const ASSESSMENT_SCALE = [
  { value: "1", label: "전혀 아니다" }, { value: "2", label: "아닌 편이다" }, { value: "3", label: "보통이다" }, { value: "4", label: "그런 편이다" }, { value: "5", label: "매우 그렇다" },
] as const;
