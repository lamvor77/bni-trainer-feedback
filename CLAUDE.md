# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 안내 문서입니다.

## 프로젝트 개요

BNI 교육 종료 후 익명 피드백을 수집하고, AI 분석을 통해 트레이너가 다음 교육을 개선할 수 있도록 돕는 시스템입니다.
전체 기획은 [PROJECT_SPEC.md](PROJECT_SPEC.md)를 참고하세요.

## 기술 스택

* Next.js 15 (App Router) — Pages Router 사용 금지
* TypeScript
* Tailwind CSS
* 모바일 우선 UI 설계
* Vercel 배포 기준

## 폴더 구조

* `app/` — 라우트와 페이지
* `components/` — 재사용 UI 컴포넌트
* `lib/` — 유틸리티, API 클라이언트
* `types/` — 공용 TypeScript 타입
* `prompts/` — AI 분석 프롬프트 템플릿
* `n8n/` — n8n 웹훅 연동 준비 문서
* `docs/` — 데이터 모델 등 설계 문서

## 현재 상태

TASK-001 (프로젝트 생성 및 기본 구조)까지 완료. Notion DB 저장, n8n Webhook 연동, AI 분석 연동은 아직 **구현되지 않았으며** `prompts/`, `n8n/`, `docs/`에 준비 문서만 있습니다.

## 작업 시 유의사항

* 기획(설문 문항, 핵심 기능)은 임의로 변경하지 않는다. 변경이 필요하면 먼저 사용자에게 확인한다.
* 다음 TASK 지시 없이 Notion/n8n/AI 실제 연동을 먼저 구현하지 않는다.
* 익명 수집이 원칙이므로 참가자를 식별할 수 있는 개인정보 필드를 추가하지 않는다.
