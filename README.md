# BNI Trainer Feedback System

BNI 교육 종료 후 익명 피드백을 수집하고, AI 분석을 통해 트레이너가 다음 교육을 개선할 수 있도록 돕는 시스템입니다.

자세한 기획과 데이터 모델은 [PROJECT_SPEC.md](PROJECT_SPEC.md)를 참고하세요.

## 기술 스택

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* 모바일 우선 UI
* Vercel 배포

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 확인할 수 있습니다.

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

## 현재 상태 (TASK-001)

* 프로젝트 생성 및 기본 폴더 구조 완료
* Notion DB / n8n Webhook / AI 분석 연동은 아직 준비 문서 단계이며 실제 구현은 이후 TASK에서 진행합니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사해 사용하세요. V1.0에서는 아직 실제로 사용되지 않습니다.
