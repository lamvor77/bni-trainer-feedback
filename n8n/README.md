# n8n Webhook 연동 준비

V1.0에서는 실제 워크플로우를 구현하지 않는다. 이후 TASK에서 아래 흐름대로 n8n 워크플로우를 구성할 예정이다.

## 예상 흐름

```text
Next.js 제출 API (app/api/feedback)
  → n8n Webhook 노드 (POST)
  → Notion DB 저장 노드
  → AI 분석 프롬프트 실행 노드 (prompts/analysis-prompt.md 참고)
  → 트레이너 알림 (예: Slack, Email 등, 추후 결정)
```

## Webhook 요청 페이로드 (예정)

`docs/data-model.md`의 Feedback 레코드 필드를 그대로 JSON body로 전송한다.

```json
{
  "trainingId": "string",
  "submittedAt": "ISO datetime",
  "rating_overall": 1,
  "rating_delivery": 1,
  "rating_preparation": 1,
  "rating_clarity": 1,
  "rating_usefulness": 1,
  "rating_duration": 1,
  "rating_participation": 1,
  "text_highlight": "string",
  "text_improvement": "string",
  "text_message": "string"
}
```

## 필요 환경 변수 (예정)

`.env.example`의 `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` 참고.

관련 문서: [../PROJECT_SPEC.md](../PROJECT_SPEC.md), [../docs/data-model.md](../docs/data-model.md)
