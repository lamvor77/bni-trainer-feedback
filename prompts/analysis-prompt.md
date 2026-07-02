# AI 분석 프롬프트 준비

V1.0에서는 실제 AI 연동을 구현하지 않는다. 아래는 이후 TASK에서 그대로 사용할 분석 프롬프트 템플릿 초안이다.

## 목적

교육별로 수집된 익명 피드백(별점 7개 + 단답형 3개)을 취합해, 트레이너가 다음 교육에서 바로 참고할 수 있는 요약 리포트를 생성한다.

## 입력 데이터

`docs/data-model.md`의 Feedback 레코드 배열 (해당 `trainingId`의 전체 응답).

## 프롬프트 템플릿 (초안)

```text
당신은 BNI 교육 트레이너를 돕는 피드백 분석 어시스턴트입니다.
아래는 한 교육 회차에 대해 참가자들이 익명으로 제출한 피드백 데이터입니다.

[별점 문항 평균]
1. 전체 만족도: {{avg_rating_overall}}
2. 트레이너 전달력: {{avg_rating_delivery}}
3. 교육 준비 충분성: {{avg_rating_preparation}}
4. 내용 이해 용이성: {{avg_rating_clarity}}
5. BNI 활동 도움 정도: {{avg_rating_usefulness}}
6. 교육 시간 적절성: {{avg_rating_duration}}
7. 참여와 소통 충분성: {{avg_rating_participation}}

[단답형 응답 목록]
- 가장 좋았던 점: {{text_highlight_list}}
- 개선하면 좋을 점: {{text_improvement_list}}
- 응원 메시지: {{text_message_list}}

다음을 포함한 리포트를 작성하세요:
1. 전체 만족도 요약 (한 문단)
2. 강점 3가지 (단답형 응답 근거 포함)
3. 개선 포인트 3가지 (단답형 응답 근거 포함, 건설적인 톤 유지)
4. 다음 교육을 위한 실행 가능한 제안 2~3가지
5. 트레이너에게 전하는 응원 메시지 모음 (원문 인용)

트레이너가 상처받지 않도록 부정적 피드백은 건설적으로 표현하되, 내용을 축소하거나 왜곡하지 마세요.
```

## 향후 결정 필요 사항

* 사용할 AI 제공자 및 모델 (추후 TASK에서 결정)
* 프롬프트 실행 위치: n8n 노드 vs. Next.js API Route
* 리포트 출력 형식 (Markdown, Notion 페이지, PDF 등)

관련 문서: [../PROJECT_SPEC.md](../PROJECT_SPEC.md), [../docs/data-model.md](../docs/data-model.md)
