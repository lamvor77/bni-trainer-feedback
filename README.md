# BNI Trainer Feedback System

BNI 교육 종료 후 참가자로부터 익명 피드백을 수집하고, Notion에 저장된 데이터를 OpenAI로 분석해 트레이너가 다음 교육을 개선할 수 있도록 돕는 시스템입니다.

기획 배경과 설문 문항 전체 목록은 [PROJECT_SPEC.md](PROJECT_SPEC.md)를 참고하세요.

## 주요 기능

* **익명 피드백 제출** (`/`) — QR로 접속해 교육명을 드롭다운에서 선택하고, 별점 7개 + 단답형 3개 문항을 제출
* **교육 정보 자동 반영** — 교육명 선택 시 기본 트레이너 자동 표시, 교육일은 오늘 날짜 기본값(수정 가능)
* **고정 QR 코드** (`/admin`) — 교육마다 새 QR을 만들 필요 없이 하나의 고정 링크/QR을 재사용
* **관리자 페이지 보호** — 간단한 비밀번호 보호(V1 임시 방식)
* **AI 분석** — 특정 교육의 Notion 피드백을 모아 OpenAI로 분석(교육 요약, 평균 점수, 강점/개선점 TOP 5, 트레이너 조언, 다음 교육 유지·개선 포인트, 한 줄 종합 평가)
* **분석 리포트 저장/조회** — 분석 결과를 Notion에 리포트로 저장하고, 관리자 화면에서 목록/상세 조회
* **PDF(인쇄) 내보내기** — 브라우저 인쇄 기능으로 리포트 상세를 PDF로 저장

## 기술 스택

* Next.js 15 (App Router)
* TypeScript
* Tailwind CSS
* 모바일 우선 UI
* Notion API (`@notionhq/client`) — 데이터 저장/조회
* OpenAI API (`openai`) — 피드백 분석
* Vercel 배포

## 로컬 실행 방법

```bash
npm install
cp .env.example .env.local   # 아래 "필요한 환경변수" 참고해 값 채우기
npm run dev
```

* 피드백 페이지: [http://localhost:3000](http://localhost:3000)
* 관리자 페이지: [http://localhost:3000/admin](http://localhost:3000/admin)

기타 명령어:

```bash
npm run build   # 프로덕션 빌드
npm run start   # 빌드된 앱 실행
npm run lint    # ESLint 검사
npx tsc --noEmit  # 타입 검사
```

## 필요한 Notion DB 목록

이 시스템은 Notion Database 3개를 사용합니다. 모두 같은 Notion Integration에 연결(공유)되어 있어야 합니다.

| DB 이름 | 용도 | 관련 환경변수 |
| --- | --- | --- |
| BNI Feedback DB | 참가자가 제출한 익명 피드백 저장 | `NOTION_FEEDBACK_DATABASE_ID` |
| BNI Training Templates | `/`의 교육명 드롭다운 목록 | `NOTION_TRAINING_TEMPLATE_DATABASE_ID` |
| BNI Training Analysis Reports | AI 분석 결과 리포트 저장 | `NOTION_ANALYSIS_REPORT_DATABASE_ID` |

각 DB에 필요한 속성(컬럼) 이름·타입 전체 목록은 [docs/data-model.md](docs/data-model.md)에 정리되어 있습니다. **속성 이름과 타입은 반드시 문서와 정확히 일치**해야 합니다(예: 숫자 속성을 텍스트로 잘못 만들면 저장이 실패합니다).

## 필요한 환경변수

`.env.example`을 복사해 `.env.local`을 만들고 아래 값을 채우세요.

| 변수명 | 설명 |
| --- | --- |
| `NOTION_API_KEY` | Notion Integration의 API 키 (3개 DB 공용) |
| `NOTION_FEEDBACK_DATABASE_ID` | BNI Feedback DB의 데이터베이스 ID |
| `NOTION_TRAINING_TEMPLATE_DATABASE_ID` | BNI Training Templates DB의 데이터베이스 ID |
| `NOTION_ANALYSIS_REPORT_DATABASE_ID` | BNI Training Analysis Reports DB의 데이터베이스 ID |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `OPENAI_MODEL` | 분석에 사용할 모델 (기본값 `gpt-4.1-mini`) |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | `/admin` 접근용 비밀번호 (V1 임시 보호 방식, 비워두면 경고 문구와 함께 보호 없이 열림) |

환경변수가 없어도 앱은 정상적으로 빌드/실행되며, 해당 기능만 안내 문구를 보여주거나 저장에 실패하는 방식으로 우아하게 처리됩니다(예: 템플릿 DB 미설정 시 드롭다운 대신 안내 문구 표시).

## Vercel 배포 방법

1. GitHub 저장소에 코드를 push합니다.
2. [Vercel](https://vercel.com)에서 **New Project** → 해당 GitHub 저장소를 Import합니다.
3. 프로젝트 **Settings → Environment Variables**에 위 7개 환경변수를 모두 등록합니다. (Production/Preview 등 필요한 환경 모두)
4. **Deploy**를 실행하고 빌드 로그에서 에러 없이 성공했는지 확인합니다.
5. 배포된 도메인(`https://xxx.vercel.app` 등)으로 접속해 `/`와 `/admin`이 정상 동작하는지 확인합니다.

## 운영 전 체크리스트

Notion DB 준비, Vercel 환경변수 등록, 배포 후 실제 동작 확인(피드백 제출 → Notion 저장 → AI 분석 → 리포트 저장/조회/PDF)까지 전체 절차는 [docs/deployment-checklist.md](docs/deployment-checklist.md)에 체크리스트로 정리되어 있습니다. 새로 배포하거나 환경을 재구축할 때는 이 문서를 순서대로 따라가세요.

## 보안 안내

* `.env.local`은 Git에 커밋하지 않습니다 (`.gitignore`에 이미 포함되어 있으며, `.env.example`만 예외적으로 커밋됩니다).
* Notion API Key와 OpenAI API Key는 외부에 공유하지 않습니다.
* `NEXT_PUBLIC_ADMIN_PASSWORD`는 클라이언트에 그대로 노출되는 V1 임시 보호 방식이며, 완전한 보안 수단이 아닙니다.
* Vercel 환경변수에는 반드시 실제 값을 입력해야 합니다. 비워두면 관련 기능이 정상 동작하지 않습니다.
* 피드백은 익명으로 수집되며, 참가자를 식별할 수 있는 개인정보(이름, 이메일, 전화번호 등)는 저장하지 않습니다.

## 폴더 구조

```text
bni-trainer-feedback/
├── app/
│   ├── page.tsx                       # 피드백 제출 페이지 (/)
│   ├── admin/page.tsx                 # 관리자 페이지 (/admin)
│   └── api/
│       ├── feedback/                  # 피드백 제출 API
│       ├── training-templates/        # 교육 템플릿 목록 API
│       ├── analyze-feedback/          # AI 분석 실행 API
│       └── analysis-reports/          # 분석 리포트 목록/상세 조회 API
├── components/     # 재사용 UI 컴포넌트 (FeedbackForm, StarRating, TrainingSelector)
├── lib/            # Notion/AI 연동 유틸리티 (notion.ts, analysis.ts)
├── types/          # 공용 TypeScript 타입 정의
├── public/         # 정적 파일
├── prompts/        # AI 분석 프롬프트 템플릿
├── n8n/            # n8n 웹훅 연동 준비 문서 (미구현, 참고용)
├── docs/           # 데이터 모델, 배포 체크리스트 등 설계 문서
├── README.md
├── PROJECT_SPEC.md
├── CLAUDE.md
└── .env.example
```

## 현재 상태

TASK-001부터 TASK-017까지 진행되어 피드백 수집 → Notion 저장 → AI 분석 → 리포트 저장/조회/PDF까지 핵심 기능이 모두 동작합니다. n8n Webhook 자동화는 아직 구현되지 않았습니다(`n8n/README.md` 참고).
