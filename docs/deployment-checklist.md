# 배포 체크리스트

이 문서는 BNI Trainer Feedback System을 처음 배포하거나, 새 환경(워크스페이스/프로젝트)에서 다시 셋업할 때 순서대로 확인하는 체크리스트다. 이번 TASK에서는 실제 배포를 진행하지 않으며, 배포 전/후 확인 절차만 정리한다.

---

## 1. Notion 준비

### 1-1. Feedback DB

* [ ] "BNI Feedback DB" 데이터베이스 생성
* [ ] 속성 15개를 정확한 이름·타입으로 생성 (자세한 목록: [data-model.md](data-model.md))
* [ ] Integration("정승원의 연결" 등)을 이 DB에 연결(공유)
* [ ] `NOTION_FEEDBACK_DATABASE_ID` 값 확보

### 1-2. Training Templates DB

* [ ] "BNI Training Templates" 데이터베이스 생성
* [ ] 속성 4개(Name/Template ID/Default Trainer/Active) 정확한 이름·타입으로 생성
* [ ] Integration을 이 DB에 연결(공유)
* [ ] 최소 1개 이상 교육 항목 추가, `Active` 체크박스 켜기
* [ ] `NOTION_TRAINING_TEMPLATE_DATABASE_ID` 값 확보

### 1-3. Analysis Reports DB

* [ ] "BNI Training Analysis Reports" 데이터베이스 생성
* [ ] 속성 18개를 정확한 이름·타입으로 생성 (특히 숫자형 속성이 실수로 텍스트로 만들어지지 않았는지 재확인)
* [ ] Integration을 이 DB에 연결(공유)
* [ ] `NOTION_ANALYSIS_REPORT_DATABASE_ID` 값 확보

> **주의**: Notion 데이터베이스 ID를 복사할 때 다른 페이지/DB의 ID를 잘못 붙여넣는 실수가 반복적으로 발생했다. ID를 넣은 뒤에는 반드시 아래 "운영 확인" 단계로 실제 조회/저장이 되는지 검증할 것.

---

## 2. OpenAI 준비

* [ ] OpenAI API Key 발급
* [ ] 사용할 모델 확인 (`gpt-4.1-mini` 기본값, 필요 시 `OPENAI_MODEL`로 변경)
* [ ] `OPENAI_API_KEY` 값 확보

---

## 3. Vercel 준비

* [ ] GitHub 저장소에 최신 코드 push
* [ ] Vercel에서 New Project → 해당 GitHub 저장소 Import
* [ ] Vercel 프로젝트의 **Environment Variables**에 아래 7개 항목을 모두 등록 (Production/Preview/Development 환경 모두 필요한지 확인)
  * `NOTION_API_KEY`
  * `NOTION_FEEDBACK_DATABASE_ID`
  * `NOTION_TRAINING_TEMPLATE_DATABASE_ID`
  * `NOTION_ANALYSIS_REPORT_DATABASE_ID`
  * `OPENAI_API_KEY`
  * `OPENAI_MODEL`
  * `NEXT_PUBLIC_ADMIN_PASSWORD`
* [ ] Deploy 실행, Build 로그에서 성공(에러 없음) 확인
* [ ] 배포된 도메인(예: `https://xxx.vercel.app`) 확인 및 접속 테스트

---

## 4. 운영 확인 (배포 후 실제 동작 점검)

* [ ] 배포된 도메인의 `/`(피드백 페이지) 접속 확인
* [ ] 교육명 드롭다운이 정상 표시되는지 확인 (Training Templates DB 연동 확인)
* [ ] 별점 7개 + 필수 텍스트 2개를 채워 테스트 피드백 1건 제출
* [ ] Notion Feedback DB에 방금 제출한 피드백이 실제로 저장되었는지 확인
* [ ] `/admin` 접속, 비밀번호 입력 화면이 뜨는지 확인 (환경변수 설정 시)
* [ ] 고정 링크와 QR 코드가 정상 표시되는지 확인, 링크 복사·QR 다운로드 동작 확인
* [ ] 드롭다운에서 방금 테스트한 교육을 선택해 "AI 분석 테스트" 실행
* [ ] 분석 결과가 화면에 정상 표시되는지 확인
* [ ] Notion Analysis Reports DB에 방금 실행한 분석 리포트가 저장되었는지 확인
* [ ] "최근 분석 리포트" 목록에 새 리포트가 보이는지, "상세 보기"가 정상 동작하는지 확인
* [ ] "PDF 다운로드" 클릭 시 인쇄 미리보기에 리포트 상세 내용만 깔끔하게 나오는지 확인
* [ ] 테스트로 생성한 피드백/리포트는 필요 시 Notion에서 정리(휴지통 이동)

---

## 5. 보안 체크리스트

* [ ] `.env.local`은 Git에 커밋되지 않는다 (`.gitignore`에 `.env*` 포함, `.env.example`만 예외)
* [ ] Notion API Key와 OpenAI API Key는 외부에 공유하지 않는다 (스크린샷, 채팅, 공개 저장소 등에 노출 주의)
* [ ] `NEXT_PUBLIC_ADMIN_PASSWORD`는 클라이언트 번들에 그대로 노출되는 V1 임시 보호 방식이며, 완전한 보안 수단이 아니다 — 민감한 운영이 필요하면 정식 인증으로 교체할 것
* [ ] Vercel 환경변수에는 반드시 실제 값을 입력해야 하며, 비워두면 기능이 정상 동작하지 않거나(피드백/리포트 저장 실패) 관리자 페이지가 비밀번호 없이 열릴 수 있다(`NEXT_PUBLIC_ADMIN_PASSWORD` 미설정 시 의도된 동작)

---

관련 문서: [../README.md](../README.md), [data-model.md](data-model.md), [../PROJECT_SPEC.md](../PROJECT_SPEC.md)
