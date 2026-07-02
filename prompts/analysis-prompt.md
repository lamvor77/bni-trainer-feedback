# AI 분석 프롬프트 준비

실제 AI 연동은 아직 구현하지 않는다. 이 문서는 다음 TASK에서 OpenAI API를 붙일 때 그대로 사용할 분석 프롬프트와 출력 구조를 정리한 것이다.

## 목적

교육별로 수집된 익명 피드백(별점 7개 + 단답형 3개)을 취합해, 트레이너가 다음 교육에서 바로 참고할 수 있는 구조화된 분석 리포트를 생성한다.

## 입력 데이터

`docs/data-model.md`의 Feedback 레코드 배열 (해당 `trainingId`의 전체 응답). 현재는 `lib/analysis.ts`의 `analyzeFeedbackBatch()`가 mock 데이터로 이 입력을 대체하고 있다.

## 출력 구조

AI 응답은 `types/analysis.ts`의 `FeedbackAnalysisResult` 타입과 정확히 일치하는 JSON으로 받는다.

* 교육 전체 요약 → `summary`
* 평균 점수 분석 → `averageScores` (문항별 평균 점수 7개)
* 강점 TOP 5 → `strengths`
* 개선점 TOP 5 → `improvements`
* 트레이너에게 주는 조언 → `trainerAdvice`
* 다음 교육에서 유지할 점 → `keepForNextTraining`
* 다음 교육에서 개선할 점 → `improveForNextTraining`
* 한 줄 종합 평가 → `oneLineReview`

## 프롬프트 템플릿 (초안)

```text
당신은 BNI 교육 트레이너를 돕는 피드백 분석 어시스턴트입니다.
아래는 한 교육 회차에 대해 참가자들이 익명으로 제출한 피드백 데이터입니다.

[교육 정보]
교육명: {{training_title}}

[별점 문항 원본 데이터]
{{ratings_json}}

[단답형 응답 목록]
- 가장 좋았던 점: {{text_highlight_list}}
- 개선하면 좋을 점: {{text_improvement_list}}
- 응원 메시지: {{text_message_list}}

아래 JSON 스키마와 정확히 일치하는 형식으로만 응답하세요. 다른 설명 텍스트는 포함하지 마세요.

{
  "summary": "교육 전체 요약 (한 문단)",
  "averageScores": {
    "overallSatisfaction": 0,
    "delivery": 0,
    "preparation": 0,
    "understanding": 0,
    "practicality": 0,
    "timeManagement": 0,
    "participation": 0
  },
  "strengths": ["강점 최대 5개, 단답형 응답 근거 포함"],
  "improvements": ["개선점 최대 5개, 건설적인 톤 유지"],
  "trainerAdvice": "트레이너에게 주는 조언 (한 문단)",
  "keepForNextTraining": ["다음 교육에서 유지할 점"],
  "improveForNextTraining": ["다음 교육에서 개선할 점"],
  "oneLineReview": "한 줄 종합 평가"
}

트레이너가 상처받지 않도록 부정적 피드백은 건설적으로 표현하되, 내용을 축소하거나 왜곡하지 마세요.
```

## 현재 구현 상태 (TASK-009)

* `types/analysis.ts` — `FeedbackAnalysisResult` 타입 정의
* `lib/analysis.ts` — `analyzeFeedbackBatch()` 함수. 현재는 OpenAI를 호출하지 않고 mock 결과만 반환
* `app/api/analyze-feedback/route.ts` — `POST` 요청을 받아 mock feedbackList를 만들어 `analyzeFeedbackBatch()`에 전달, `{ ok, analysis }` 반환
* `/admin`의 "AI 분석 테스트" 버튼으로 위 API를 직접 호출해 결과를 확인 가능

## 향후 결정 필요 사항

* 사용할 OpenAI 모델 (다음 TASK에서 결정)
* Notion Feedback DB에서 실제 `trainingId` 기준으로 피드백을 조회하는 로직 (다음 TASK)
* 위 JSON 스키마를 OpenAI Structured Outputs / JSON mode로 강제하는 방법
* 리포트 출력 형식 (관리자 화면, Notion 페이지, PDF 등)

관련 문서: [../PROJECT_SPEC.md](../PROJECT_SPEC.md), [../docs/data-model.md](../docs/data-model.md), [../types/analysis.ts](../types/analysis.ts)
