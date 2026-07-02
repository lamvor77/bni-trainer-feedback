# PROJECT_SPEC.md — BNI Trainer Feedback System

## 목적

BNI 교육 종료 후 참가자로부터 익명 피드백을 수집하고, AI 분석을 통해 트레이너가 다음 교육을 개선할 수 있도록 돕는다.

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS |
| UI 우선순위 | 모바일 우선 |
| 배포 | Vercel |
| 데이터 저장 (예정) | Notion DB |
| 자동화 (예정) | n8n Webhook |
| 분석 (예정) | AI 분석 프롬프트 |

## 폴더 구조

```text
bni-trainer-feedback/
├── app/            # Next.js App Router 페이지 및 라우트
├── components/     # 재사용 UI 컴포넌트
├── lib/            # 유틸리티, API 클라이언트, 헬퍼
├── types/          # 공용 TypeScript 타입 정의
├── public/         # 정적 파일
├── prompts/        # AI 분석용 프롬프트 템플릿
├── n8n/            # n8n 워크플로우 연동 준비 문서
├── docs/           # 데이터 모델 등 설계 문서
├── README.md
├── PROJECT_SPEC.md
├── CLAUDE.md
└── .env.example
```

## V1.0 핵심 기능

1. 익명 피드백 페이지
2. 교육별 URL 접속 (예: `/feedback/[trainingId]`)
3. 별점 7개 문항
4. 단답형 3개 문항
5. 제출 완료 화면
6. Notion DB 저장 준비
7. n8n Webhook 연동 준비
8. AI 분석 프롬프트 준비

> V1.0 범위에서는 위 기능의 **설계와 준비**까지만 다루며, Notion/n8n/AI 실제 연동은 이후 TASK에서 구현한다.

## 설문 문항

### 별점 문항 (7개, 1~5점 척도)

1. 이번 교육의 전체 만족도는 어떠셨나요?
2. 트레이너의 전달력은 어떠셨나요?
3. 교육 준비는 충분했다고 느끼셨나요?
4. 교육 내용은 이해하기 쉬웠나요?
5. 교육 내용은 실제 BNI 활동에 도움이 될 것 같습니까?
6. 교육 시간은 적절했다고 생각하십니까?
7. 교육 참여와 소통은 충분했다고 생각하십니까?

### 단답형 문항 (3개)

8. 오늘 교육에서 가장 좋았던 점은 무엇이었나요?
9. 더 좋은 교육을 위해 개선하면 좋을 점은 무엇인가요?
10. 트레이너에게 응원의 한마디 또는 전하고 싶은 메시지가 있다면 남겨주세요.

## 데이터 흐름 (예정)

```text
참가자 → 익명 피드백 페이지 (/feedback/[trainingId])
       → 제출 API (app/api/feedback)
       → n8n Webhook
       → Notion DB 저장
       → AI 분석 프롬프트 실행
       → 트레이너용 분석 리포트
```

관련 문서: [docs/data-model.md](docs/data-model.md), [n8n/README.md](n8n/README.md), [prompts/analysis-prompt.md](prompts/analysis-prompt.md)

## 이번 TASK(TASK-001) 완료 조건

* Next.js 15 프로젝트가 정상 생성되어야 한다.
* `npm run dev` 실행 시 로컬에서 페이지가 열려야 한다.
* 기본 홈 화면에 "BNI Trainer Feedback System" 문구가 보여야 한다.
* Notion, n8n, AI 연동은 아직 구현하지 않는다 (준비 문서만 포함).
* 프로젝트 생성과 기본 구조만 만든다.
