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

## 저장 흐름

```text
FeedbackForm 제출
  → POST /api/feedback
  → 서버 검증 (별점 7개 범위, 필수 텍스트 2개)
  → lib/notion.ts createFeedbackPage()
  → Notion Database에 페이지 생성
```

필요 환경변수: `NOTION_API_KEY`, `NOTION_FEEDBACK_DATABASE_ID` (`.env.example` 참고). 둘 중 하나라도 없으면 저장 없이 오류 응답을 반환한다.

n8n Webhook, AI 분석은 아직 연동하지 않았다.

관련 문서: [../PROJECT_SPEC.md](../PROJECT_SPEC.md), [../n8n/README.md](../n8n/README.md)
