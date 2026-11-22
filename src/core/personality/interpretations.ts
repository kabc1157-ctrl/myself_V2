import type { PersonalityDimension } from "./questions";
import type { ScoreBand } from "./scoring";

/**
 * IEUMSAE P3: fixed interpretation dictionary (10 dimensions × 3 bands).
 * These are exploratory descriptions of responses, not diagnoses or
 * validated assessments. Wording revisions require an interpretation version bump.
 */
export type InterpretationRule = {
  summary: string;
  lifeMeaning: string;
  possibleStrength: string;
  watchout: string;
  action: string;
  shortLabel: string;
};

export const INTERPRETATION_RULES: Record<
  PersonalityDimension,
  Record<ScoreBand, InterpretationRule>
> = {
  openness: {
    low: {"summary":"익숙하고 검증된 방식에 더 편안함을 느낀다는 응답이에요.","lifeMeaning":"새로운 방법보다 잘 아는 방식에서 안정적인 출발점을 찾을 수 있어요.","possibleStrength":"익숙한 방법의 장점을 파악하는 태도를 활용해 보세요.","watchout":"새로운 접근을 충분히 살펴보기도 전에 제외하는지 관찰해 보세요.","action":"이미 잘하는 방식 한 가지를 유지하면서 작은 변화를 한 번만 시도해 보세요.","shortLabel":"익숙한 방식 선호"},
    mixed: {"summary":"익숙한 방식과 새로운 시도를 함께 고려한다는 응답이에요.","lifeMeaning":"상황과 목적에 따라 탐색과 반복의 비중이 달라질 수 있어요.","possibleStrength":"상황에 맞춰 접근법을 비교할 여지가 있어요.","watchout":"선택할 방법을 오래 고민해 시작이 늦어지는지 살펴보세요.","action":"새로운 시도가 필요한 일과 기존 방식을 유지할 일을 나눠 적어 보세요.","shortLabel":"익숙함과 새로움 조율"},
    high: {"summary":"새로운 경험과 아이디어를 탐색하려는 경향이 높게 나타났어요.","lifeMeaning":"다양한 관점을 접하고 다른 가능성을 살피는 활동에 흥미를 느낄 수 있어요.","possibleStrength":"새로운 가능성을 발견하고 탐색하는 태도를 활용해 보세요.","watchout":"새로 시작하는 일과 실제 완료하는 일 사이에 차이가 있는지 살펴보세요.","action":"새로운 목표를 시작할 때 작은 완료 기준을 먼저 정해 보세요.","shortLabel":"새로운 가능성 탐색"},
  },
  conscientiousness: {
    low: {"summary":"세부 계획과 규칙을 엄격히 따르는 방식에 대한 동의가 낮게 나타났어요.","lifeMeaning":"상황에 맞춰 움직이거나 즉시 실행하는 방식을 더 편하게 느낄 수 있어요.","possibleStrength":"상황에 맞춰 움직일 수 있는 실행 방식을 탐색해 보세요.","watchout":"마감이나 반복 업무가 누락되는 상황이 있는지 확인해 보세요.","action":"필수 과제에만 가장 작은 완료 기준을 하나 설정해 보세요.","shortLabel":"유연한 진행 선호"},
    mixed: {"summary":"계획과 즉흥적인 실행을 모두 활용한다는 응답이에요.","lifeMeaning":"일의 성격에 따라 구조화가 도움 될 수도 있고 자유로운 진행이 편할 수도 있어요.","possibleStrength":"필요에 따라 계획의 밀도를 조절해 볼 수 있어요.","watchout":"계획이 필요한 일까지 즉흥적으로 처리하거나 반대인지 살펴보세요.","action":"중요한 일만 일정에 고정하고 나머지는 여유 있게 배치해 보세요.","shortLabel":"계획과 즉흥 실행 병행"},
    high: {"summary":"계획을 세우고 책임 있게 마무리하는 태도에 높은 동의를 보였어요.","lifeMeaning":"해야 할 일의 순서와 약속을 중요하게 여기는 방식이 잘 맞을 수 있어요.","possibleStrength":"진행 과정을 정리하고 완료를 챙기는 태도를 활용해 보세요.","watchout":"계획이 틀어졌을 때 자신을 지나치게 압박하는지 관찰해 보세요.","action":"하루의 핵심 계획과 조정 가능한 계획을 분리해 보세요.","shortLabel":"계획과 완료 중시"},
  },
  extraversion: {
    low: {"summary":"혼자만의 시간과 활동에서 더 편안함을 느낀다는 응답이에요.","lifeMeaning":"사람들과의 교류량보다 자신에게 맞는 에너지 회복 방식을 중시할 수 있어요.","possibleStrength":"혼자 몰입하는 시간의 가치를 활용해 보세요.","watchout":"필요한 관계까지 피하게 되는 상황이 있는지만 확인해 보세요.","action":"교류 일정 사이에 충분한 혼자만의 시간을 배치해 보세요.","shortLabel":"혼자만의 시간 선호"},
    mixed: {"summary":"교류에 대한 선호가 상황에 따라 달라진다는 응답이에요.","lifeMeaning":"관계의 깊이와 활동의 맥락에 따라 편안함이 달라질 수 있어요.","possibleStrength":"상황별 에너지 수준을 살피는 태도를 활용해 보세요.","watchout":"일정이 많은 날과 혼자 있는 날의 피로 차이를 기록해 보세요.","action":"교류 후 에너지 변화를 짧게 기록해 적절한 빈도를 찾아보세요.","shortLabel":"상황에 따른 교류 조절"},
    high: {"summary":"다른 사람과의 교류에서 활력을 느낀다는 응답이 많았어요.","lifeMeaning":"함께 이야기하고 활동하는 기회가 동기가 될 수 있어요.","possibleStrength":"교류를 통해 아이디어와 동기를 얻는 방식을 활용해 보세요.","watchout":"만남이 많을 때 개인적으로 집중할 시간이 줄어드는지 살펴보세요.","action":"함께 할 일과 혼자 마무리할 일을 구분해 보세요.","shortLabel":"사람과의 교류에서 활력"},
  },
  agreeableness: {
    low: {"summary":"협력과 상대 의견 조율보다 독립적인 판단을 중시한다는 응답에 가까워요.","lifeMeaning":"자신의 생각을 분명히 표현하는 방식이 편할 수 있어요.","possibleStrength":"자신의 기준과 의견을 명료하게 정리하는 태도를 활용해 보세요.","watchout":"의견을 전할 때 상대의 상황을 놓치는 순간이 있는지 살펴보세요.","action":"중요한 결정에서 내 기준과 상대의 관점을 함께 적어 보세요.","shortLabel":"독립적인 의견 표현"},
    mixed: {"summary":"자기 의견과 관계 속 협력을 조율한다는 응답이에요.","lifeMeaning":"상황에 따라 개인의 판단과 관계를 모두 고려할 수 있어요.","possibleStrength":"여러 입장을 비교해 볼 여지가 있어요.","watchout":"갈등을 줄이려다 자신의 요구를 지나치게 미루는지 관찰해 보세요.","action":"결정을 앞두고 내 필요와 상대의 필요를 한 줄씩 적어 보세요.","shortLabel":"협력과 자기 의견 조율"},
    high: {"summary":"상대를 배려하고 협력하려는 태도에 높은 동의를 보였어요.","lifeMeaning":"관계에서 공감과 조율을 중요하게 여길 가능성이 있어요.","possibleStrength":"타인의 관점을 고려하고 협력하려는 태도를 활용해 보세요.","watchout":"배려를 위해 자신의 시간이나 우선순위를 계속 양보하는지 살펴보세요.","action":"도움 요청을 수락할 때 내 여유도 함께 확인해 보세요.","shortLabel":"배려와 협력 중시"},
  },
  emotional_sensitivity: {
    low: {"summary":"걱정이나 감정 동요를 비교적 적게 경험한다는 응답이에요.","lifeMeaning":"일상적인 변화에 대해 차분하게 반응한다고 느낄 수 있어요.","possibleStrength":"상황을 차분히 돌아보는 태도를 활용해 보세요.","watchout":"감정 신호를 너무 늦게 알아차리는 경우가 있는지 살펴보세요.","action":"하루에 한 번 감정 상태를 짧게 확인해 보세요.","shortLabel":"비교적 차분한 정서 반응"},
    mixed: {"summary":"상황에 따라 걱정과 감정 반응이 달라진다는 응답이에요.","lifeMeaning":"특정 상황에서만 정서적 부담이 커질 수 있어요.","possibleStrength":"상황에 따른 반응 차이를 살펴볼 수 있어요.","watchout":"어떤 사건에서 감정이 오래 남는지 관찰해 보세요.","action":"감정이 달라진 날의 상황을 한 줄로 기록해 보세요.","shortLabel":"상황별 정서 반응"},
    high: {"summary":"걱정과 감정의 변화가 비교적 자주 나타난다는 응답이에요.","lifeMeaning":"예상과 다른 상황에 정서적으로 민감하게 반응한다고 느낄 수 있어요.","possibleStrength":"자신의 감정 변화를 알아차리는 태도를 활용해 보세요.","watchout":"계획 차질이 생긴 날 자신을 과하게 비난하는지 살펴보세요.","action":"예상 밖의 일이 생기면 계획 조정과 감정 기록을 분리해 보세요.","shortLabel":"정서적 변화에 민감"},
  },
  promotion: {
    low: {"summary":"성취나 성장 보상이 행동의 주된 동기라는 응답은 적었어요.","lifeMeaning":"목표 달성 외에 편안함이나 일상의 의미가 더 중요한 동기가 될 수 있어요.","possibleStrength":"자신에게 실제 의미 있는 동기를 찾는 태도를 활용해 보세요.","watchout":"타인의 성취 목표를 자신의 목표로 받아들이고 있지 않은지 확인해 보세요.","action":"성취 외에도 행동을 시작하게 하는 이유 한 가지를 적어 보세요.","shortLabel":"성장 보상 외 동기 탐색"},
    mixed: {"summary":"목표와 상황에 따라 성취 동기가 달라진다는 응답이에요.","lifeMeaning":"성장 가능성이 중요한 일도 있지만 반드시 모든 일에 적용되지는 않을 수 있어요.","possibleStrength":"일별로 달라지는 동기를 살펴볼 수 있어요.","watchout":"큰 보상이 없는 일을 지나치게 미루는지 관찰해 보세요.","action":"목표마다 '왜 하고 싶은지' 한 줄을 추가해 보세요.","shortLabel":"상황에 따른 성취 동기"},
    high: {"summary":"새로운 성취와 발전 가능성에 높은 동의를 보였어요.","lifeMeaning":"성장이 눈에 보일 때 실행 동기가 커질 수 있어요.","possibleStrength":"작은 진전을 발견하고 동기로 활용해 보세요.","watchout":"성취가 눈에 띄지 않는 반복 과정에서 흥미가 줄어드는지 살펴보세요.","action":"큰 목표를 일주일 단위의 작은 진전으로 나눠 보세요.","shortLabel":"성장과 성취에서 동기"},
  },
  prevention: {
    low: {"summary":"위험 방지와 안정이 행동의 주된 동기라는 응답은 적었어요.","lifeMeaning":"불확실성을 감수하고 시작하는 방식이 편할 수 있어요.","possibleStrength":"새로운 시도를 지나치게 미루지 않는 태도를 활용해 보세요.","watchout":"중요한 일에서도 필요한 점검을 생략하는지 살펴보세요.","action":"되돌리기 어려운 일에만 필수 확인 항목을 정해 보세요.","shortLabel":"위험보다 실행 중시"},
    mixed: {"summary":"상황에 따라 안정성과 위험을 고려한다는 응답이에요.","lifeMeaning":"책임의 크기나 익숙함에 따라 준비 수준이 달라질 수 있어요.","possibleStrength":"상황에 맞게 점검 수준을 조절해 보세요.","watchout":"작은 결정에도 같은 수준의 점검 시간을 쓰는지 관찰해 보세요.","action":"위험이 큰 일에만 사전 점검 시간을 정해 보세요.","shortLabel":"상황에 따른 안정 고려"},
    high: {"summary":"책임을 지키고 실수를 예방하는 방식에 높은 동의를 보였어요.","lifeMeaning":"준비와 안정적인 진행이 행동의 중요한 동기가 될 수 있어요.","possibleStrength":"미리 위험을 살피고 준비하는 태도를 활용해 보세요.","watchout":"완벽하게 준비해야 한다는 생각 때문에 시작이 늦어지는지 살펴보세요.","action":"점검 항목을 세 가지로 제한하고 시작 시점을 정해 보세요.","shortLabel":"안정과 실수 예방 중시"},
  },
  time_centered: {
    low: {"summary":"정해진 시간에 맞춰 시작하는 방식에 대한 동의가 낮았어요.","lifeMeaning":"일정표보다 다른 실행 단서가 더 편할 수 있어요.","possibleStrength":"자신에게 맞는 시작 조건을 탐색해 보세요.","watchout":"시간을 정하지 않아도 중요한 일을 시작하는지 확인해 보세요.","action":"시간표 대신 실행할 행동의 순서를 먼저 정해 보세요.","shortLabel":"고정 시간 선호 낮음"},
    mixed: {"summary":"시간표 활용의 편안함이 상황에 따라 달라진다는 응답이에요.","lifeMeaning":"일부 일정은 고정 시간이 도움 되고 다른 일은 유연한 진행이 편할 수 있어요.","possibleStrength":"일의 성격에 맞게 시간표를 선택해 보세요.","watchout":"고정 시간이 도움 된 날과 방해 된 날을 비교해 보세요.","action":"가장 중요한 일정 하나만 시작 시간을 정해 보세요.","shortLabel":"필요에 따라 시간표 활용"},
    high: {"summary":"정해진 시작 시간을 활용하는 방식에 높은 동의를 보였어요.","lifeMeaning":"고정된 시간이 행동을 시작하는 단서가 될 수 있어요.","possibleStrength":"시작 시간을 구체화하는 태도를 활용해 보세요.","watchout":"시간을 지키지 못한 날 전체 계획을 포기하는지 살펴보세요.","action":"반복할 일의 시작 시간 한 가지만 먼저 고정해 보세요.","shortLabel":"고정 시간 활용 선호"},
  },
  cue_centered: {
    low: {"summary":"기존 행동에 다음 행동을 연결하는 방식에 대한 동의가 낮았어요.","lifeMeaning":"행동 사이의 연결보다 별도의 시작 신호가 편할 수 있어요.","possibleStrength":"스스로 반응하기 쉬운 시작 신호를 탐색해 보세요.","watchout":"매번 새로 시작해야 해서 루틴이 빠지는지 관찰해 보세요.","action":"습관 연결 대신 눈에 보이는 체크리스트를 시험해 보세요.","shortLabel":"행동 연결 선호 낮음"},
    mixed: {"summary":"행동을 연결하는 방식에 대한 선호가 상황에 따라 달라졌어요.","lifeMeaning":"어떤 활동은 연속해서, 다른 활동은 독립적으로 시작할 수 있어요.","possibleStrength":"활동별로 다른 시작 단서를 비교해 보세요.","watchout":"연결한 루틴이 실제로 이어지는지 기록으로 확인해 보세요.","action":"이미 하는 행동 뒤에 짧은 루틴 하나만 연결해 보세요.","shortLabel":"상황에 따른 행동 연결"},
    high: {"summary":"이미 하던 행동을 다음 행동의 계기로 삼는 방식에 높은 동의를 보였어요.","lifeMeaning":"하나의 행동을 마친 직후 다음 활동을 시작하는 방식이 편할 수 있어요.","possibleStrength":"기존 습관을 시작 단서로 활용해 보세요.","watchout":"앞선 행동이 빠질 때 연결된 루틴도 함께 빠지는지 확인해 보세요.","action":"'양치 후 물 한 잔'처럼 기존 행동 뒤에 짧은 루틴을 연결해 보세요.","shortLabel":"습관을 계기로 실행 선호"},
  },
  flexible_execution: {
    low: {"summary":"계획이 바뀔 때 방법을 조정하는 데 대한 동의가 낮았어요.","lifeMeaning":"처음 정한 방법을 유지하는 방식이 편할 수 있어요.","possibleStrength":"정해진 과정을 안정적으로 유지하는 태도를 활용해 보세요.","watchout":"예상치 못한 변화로 실행 자체가 멈추는지 살펴보세요.","action":"계획이 틀어졌을 때 사용할 대안 한 가지를 미리 적어 보세요.","shortLabel":"기존 계획 유지 선호"},
    mixed: {"summary":"상황에 따라 계획을 유지하거나 조정한다는 응답이에요.","lifeMeaning":"계획의 중요도에 맞춰 변경 범위를 다르게 둘 수 있어요.","possibleStrength":"필요에 따라 조정 범위를 선택해 보세요.","watchout":"조정이 필요한 순간을 놓치거나 지나치게 자주 바꾸는지 살펴보세요.","action":"고정할 기준 하나와 바꿔도 되는 방법 하나를 정해 보세요.","shortLabel":"상황에 따른 실행 조절"},
    high: {"summary":"목표를 이어가기 위해 방법이나 순서를 바꾸는 방식에 높은 동의를 보였어요.","lifeMeaning":"상황이 달라져도 실행 방법을 조정하며 계속할 가능성이 있어요.","possibleStrength":"다른 방법을 찾아 다시 시작하는 태도를 활용해 보세요.","watchout":"방법을 자주 바꾸느라 완료 기준이 흐려지는지 관찰해 보세요.","action":"완료 기준은 유지하고 실행 순서만 조정해 보세요.","shortLabel":"방법과 순서의 유연한 조정"},
  },
};

export function interpretDimension(dimension: PersonalityDimension, band: ScoreBand): InterpretationRule {
  return INTERPRETATION_RULES[dimension][band];
}
