# 데이터 모델 (Notion DB 저장 준비)

V1.0에서는 실제 Notion 연동을 구현하지 않지만, 이후 TASK에서 그대로 사용할 수 있도록 예상 데이터 모델을 정리해 둔다.

## Feedback 레코드

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `trainingId` | string | 교육 회차 식별자 (URL 경로에 사용) |
| `submittedAt` | ISO datetime | 제출 시각 |
| `rating_overall` | number (1-5) | 1. 전체 만족도 |
| `rating_delivery` | number (1-5) | 2. 트레이너 전달력 |
| `rating_preparation` | number (1-5) | 3. 교육 준비 충분성 |
| `rating_clarity` | number (1-5) | 4. 내용 이해 용이성 |
| `rating_usefulness` | number (1-5) | 5. BNI 활동 도움 정도 |
| `rating_duration` | number (1-5) | 6. 교육 시간 적절성 |
| `rating_participation` | number (1-5) | 7. 참여와 소통 충분성 |
| `text_highlight` | string | 8. 가장 좋았던 점 |
| `text_improvement` | string | 9. 개선하면 좋을 점 |
| `text_message` | string | 10. 트레이너에게 응원 메시지 |

익명 수집이 원칙이므로 참가자를 식별할 수 있는 필드(이름, 이메일 등)는 저장하지 않는다.

## 저장 대상 (예정)

* Notion Database — 위 필드에 대응하는 컬럼 구성
* 연동 방식: Next.js 제출 API → n8n Webhook → Notion API

관련 문서: [../PROJECT_SPEC.md](../PROJECT_SPEC.md), [../n8n/README.md](../n8n/README.md)
