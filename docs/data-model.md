# 데이터 모델 (Notion DB 저장)

`/api/feedback`이 수신한 피드백은 검증 통과 후 Notion Database에 페이지 1건으로 저장된다. (`lib/notion.ts`)

## Notion Feedback DB 속성

| Notion 속성명 | 타입 | 매핑되는 데이터 |
| --- | --- | --- |
| Name | title | `피드백 - {교육명 또는 trainingId 또는 "일반교육"} - {YYYY-MM-DD HH:mm}` |
| Training ID | rich_text | `training.trainingId` |
| Training Title | rich_text | `training.trainingTitle` |
| Trainer | rich_text | `training.trainerName` |
| Training Date | date | `training.trainingDate` (유효한 날짜일 때만 저장, 아니면 비움) |
| Submitted At | date | `submittedAt` (항상 저장) |
| Overall Satisfaction | number | 1. 전체 만족도 |
| Delivery | number | 2. 트레이너 전달력 |
| Preparation | number | 3. 교육 준비 충분성 |
| Understanding | number | 4. 내용 이해 용이성 |
| Practicality | number | 5. BNI 활동 도움 정도 |
| Time Management | number | 6. 교육 시간 적절성 |
| Participation | number | 7. 참여와 소통 충분성 |
| Best Point | rich_text | 8. 가장 좋았던 점 |
| Improvement Point | rich_text | 9. 개선하면 좋을 점 |
| Message to Trainer | rich_text | 10. 트레이너에게 응원 메시지 |

익명 수집이 원칙이므로 참가자를 식별할 수 있는 필드(이름, 이메일 등)는 저장하지 않는다.

## Notion Training Templates DB 속성

`/` 화면의 교육명 드롭다운은 별도의 Notion DB(`BNI Training Templates`)에서 목록을 가져온다. (`lib/notion.ts` `getTrainingTemplates()`)

| Notion 속성명 | 타입 | 설명 |
| --- | --- | --- |
| Name | title | 드롭다운에 표시되는 교육명 |
| Template ID | rich_text | 교육 식별자 (비어 있으면 Notion page id를 대신 사용) |
| Default Trainer | rich_text | 해당 교육 선택 시 자동 표시되는 트레이너명 |
| Active | checkbox | true인 항목만 드롭다운에 노출 |

필요 환경변수: `NOTION_TRAINING_TEMPLATE_DATABASE_ID` (`NOTION_API_KEY`는 Feedback DB와 공용). 환경변수가 없거나 조회에 실패하면 빈 배열을 반환하며, 이 경우 화면은 드롭다운 대신 안내 문구를 보여주고 `trainingTitle`은 "일반교육"으로 저장된다.

## Notion Training Analysis Reports DB 속성

`/admin`에서 AI 분석을 실행하면 결과가 별도 Notion DB(`BNI Training Analysis Reports`)에 리포트 1건으로 저장된다. (`lib/notion.ts` `createAnalysisReportPage()`, `getAnalysisReports()`, `getAnalysisReportById()`)

| Notion 속성명 | 타입 | 매핑되는 데이터 |
| --- | --- | --- |
| Name | title | `분석 리포트 - {교육명 또는 trainingId 또는 "일반교육"} - {YYYY-MM-DD HH:mm}` |
| Training ID | rich_text | 분석 대상 `trainingId` |
| Training Title | rich_text | 분석 대상 `trainingTitle` |
| Analyzed At | date | 분석 실행 시각 |
| Summary | rich_text | 교육 전체 요약 |
| One Line Review | rich_text | 한 줄 종합 평가 |
| Overall Satisfaction | number | 평균 점수 — 전체 만족도 |
| Delivery | number | 평균 점수 — 전달력 |
| Preparation | number | 평균 점수 — 준비도 |
| Understanding | number | 평균 점수 — 이해도 |
| Practicality | number | 평균 점수 — 실무 적용성 |
| Time Management | number | 평균 점수 — 시간 관리 |
| Participation | number | 평균 점수 — 참여도 |
| Strengths | rich_text | 강점 TOP 5 (줄바꿈으로 구분) |
| Improvements | rich_text | 개선점 TOP 5 (줄바꿈으로 구분) |
| Trainer Advice | rich_text | 트레이너에게 주는 조언 |
| Keep For Next Training | rich_text | 다음 교육에서 유지할 점 (줄바꿈으로 구분) |
| Improve For Next Training | rich_text | 다음 교육에서 개선할 점 (줄바꿈으로 구분) |

평균 점수는 OpenAI가 아니라 서버(`lib/analysis.ts`)에서 피드백 원본 점수로 직접 계산한 값을 저장한다. 필요 환경변수: `NOTION_ANALYSIS_REPORT_DATABASE_ID` (`NOTION_API_KEY`는 다른 DB와 공용). 환경변수가 없거나 저장에 실패하면 분석 자체는 성공했더라도 API가 오류를 반환한다.

## 저장 흐름

```text
/ 페이지 로드 → GET /api/training-templates → 드롭다운에 Active 교육 목록 표시
FeedbackForm 제출
  → training 정보 우선순위: 1) 드롭다운 선택 2) URL 파라미터(?training=&title=&trainer=&date=) 3) "일반교육"
  → POST /api/feedback
  → 서버 검증 (별점 7개 범위, 필수 텍스트 2개)
  → lib/notion.ts createFeedbackPage()
  → Notion Feedback DB에 페이지 생성

/admin "AI 분석 테스트" 클릭
  → POST /api/analyze-feedback { trainingId, trainingTitle }
  → lib/notion.ts getFeedbackByTrainingId()로 Notion Feedback DB 조회
  → 피드백이 없으면 "분석할 피드백이 없습니다." 반환
  → lib/analysis.ts analyzeFeedbackBatch()로 OpenAI 분석 (평균 점수는 서버 계산)
  → lib/notion.ts createAnalysisReportPage()로 Notion Analysis Reports DB에 저장
  → 성공 시 분석 결과 반환, /admin의 "최근 분석 리포트" 목록 자동 갱신
```

필요 환경변수: `NOTION_API_KEY`, `NOTION_FEEDBACK_DATABASE_ID` (`.env.example` 참고). 둘 중 하나라도 없으면 저장 없이 오류 응답을 반환한다.

n8n Webhook 자동화는 아직 연동하지 않았다 (`n8n/README.md` 참고, 참고용 설계 문서만 존재).

관련 문서: [../README.md](../README.md), [deployment-checklist.md](deployment-checklist.md), [../PROJECT_SPEC.md](../PROJECT_SPEC.md), [../n8n/README.md](../n8n/README.md)
