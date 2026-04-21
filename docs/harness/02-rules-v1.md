# 코딩 규칙 v1

확정일: 2026-04-20
출처: docs/harness/01-diagnosis.md
반영 위치: CLAUDE.md

---

## 📌 요약

20개 규칙 전체 채택. 아키텍처 3-tier 분리, Result 패턴 에러 처리 통일, Server Component 기본, 네이밍 컨벤션 공식화, 자가 리뷰 체크리스트 9항목 도입.

| 카테고리 | 규칙 수 | 핵심 |
|----------|---------|------|
| 아키텍처 | 3 | Presentation / Business Logic / Data Access 분리 |
| 폴더 구조 | 3 | `lib/services/` 신설, feature 단위 컴포넌트 |
| API 호출 | 4 | Result 패턴, `Promise.allSettled`, 타임아웃 5000ms |
| 컴포넌트 | 4 | Server Component 기본, Props interface, try-catch, 400줄 제한 |
| 네이밍 | 3 | PascalCase/kebab-case/camelCase 구분, `@/` 절대경로 |
| PR/리뷰 | 3 | 500줄 제한, 한글 커밋 메시지, 자가 리뷰 체크리스트 |

---

## 🎯 주요 결정 사항

### Q1. `lib/api/` 에러 처리 통일 전략

- **질문:** 현재 3가지 에러 패턴(throw, null 반환, 에러 객체)이 혼재. 어떤 방향으로 통일할지?
- **선택한 답:** A — Result 패턴 통일
- **결정 근거:** 모든 `lib/api/` 함수가 `{ success: true, data } | { success: false, error }` 반환. throw는 프로그래머 에러(설정 누락)에만 사용. 호출자가 함수 시그니처만으로 에러 처리 방법을 알 수 있게 됨.

### Q2. `lib/services/` 레이어 도입 시기

- **질문:** 비즈니스 로직 분리를 위한 서비스 레이어를 언제 도입할지?
- **선택한 답:** A — 즉시 도입
- **결정 근거:** 현재 컴포넌트에 있는 비즈니스 로직(`EbookAvailabilityCell`의 에러 해석, `PhysicalAvailabilityCell`의 상태 판단 등)을 `lib/services/availability.ts`로 추출.

### Q3. 테스트 전략

- **질문:** 현재 테스트가 전혀 없음. 어떤 수준부터 시작할지?
- **선택한 답:** A — API 클라이언트 단위 테스트 우선
- **결정 근거:** `lib/api/` 함수들에 Vitest 단위 테스트 추가부터 시작. 가장 중요한 데이터 레이어부터 테스트 커버리지 확보.

### Q4. 사용되지 않는 코드 처리

- **질문:** `LibraryResult` 타입과 빈 `EBOOK_LIBRARY_CONFIGS`의 처리?
- **선택한 답:** A — 즉시 삭제
- **결정 근거:** 사용하지 않는 코드는 바로 제거. 필요할 때 다시 추가. Git 히스토리에서 복구 가능.

### Q5. 규칙 적용 범위

- **질문:** 규칙들을 어디에 문서화할지?
- **선택한 답:** Phase 1: A (CLAUDE.md에 전부), Phase 2: 린트 승격
- **결정 근거:** 빠르게 시작하기 위해 CLAUDE.md에 모든 규칙을 집중. 운용 후 자주 위반되는 규칙은 린트 규칙으로 승격.

---

## ✅ 확정된 규칙 전체 목록

### 아키텍처

- [확정됨] **A1**: 3-tier — Presentation (`components/`, `app/**/page.tsx`) / Business Logic (`lib/services/`) / Data Access (`lib/api/`)
- [확정됨] **A2**: 컴포넌트는 표시만. 비즈니스 로직은 `lib/services/` 또는 `lib/utils/`
- [확정됨] **A3**: 페이지 데이터 변환 5줄 이상이면 `lib/services/`로 추출

### 폴더 구조

- [확정됨] **F1**: `lib/services/` 폴더 추가 (`api/`, `services/`, `constants/`, `utils/`)
- [확정됨] **F2**: `components/` feature 단위 유지 (`library/`, `search/`, `ui/`)
- [확정됨] **F3**: 공유 타입 `types/index.ts`, 내부 타입은 해당 파일 내

### API 호출

- [확정됨] **D1**: Result 패턴 — `{ success: true, data } | { success: false, error }`, throw는 프로그래머 에러에만
- [확정됨] **D2**: 병렬 호출은 `Promise.allSettled()`
- [확정됨] **D3**: 외부 HTTP 타임아웃 필수 — `AbortSignal.timeout(5000)`
- [확정됨] **D4**: API 라우트 응답 표준 — `{ success, data?, error?, meta? }`

### 컴포넌트

- [확정됨] **C1**: Server Component 기본. `"use client"`는 훅/이벤트 핸들러/브라우저 API에만
- [확정됨] **C2**: Props 타입은 `interface XxxProps`로 정의. 인라인 금지
- [확정됨] **C3**: async Server Component에서 외부 호출 시 try-catch 필수 + fallback UI
- [확정됨] **C4**: 컴포넌트 파일 400줄 제한

### 네이밍

- [확정됨] **N1**: PascalCase(컴포넌트), kebab-case(유틸/상수/디렉토리), camelCase(함수), UPPER_SNAKE_CASE(상수)
- [확정됨] **N2**: 공유 타입 `type`, Props 타입 `interface`
- [확정됨] **N3**: `@/` 절대 경로 사용. 상대 경로는 같은 폴더 내에서만

### PR/리뷰

- [확정됨] **P1**: PR 500줄 이하
- [확정됨] **P2**: 커밋 메시지 `<type>: <한글 설명>`
- [확정됨] **P3**: 자가 리뷰 체크리스트 9항목
- [확정됨] **P4**: 하나의 브랜치 = 하나의 이슈

---

## 📝 보류된 규칙

이번 v1에서 보류된 규칙 없음 — 제안된 20개 규칙 전체 채택.

---

## 🔄 다음 단계

- [ ] `.claude/commands/self-review.md` 생성 (Step 3) — 자가 리뷰 체크리스트를 slash command로 자동화
- [ ] 2~4주 운용 후 회고: `docs/harness/03-retrospective.md` 작성
- [ ] Q5 Phase 2: 자주 위반되는 규칙을 린트 규칙(ESLint 커스텀 룰 등)으로 승격 → `docs/harness/04-rules-v2.md` 예정
- [ ] Q2 실행: `lib/services/` 레이어 도입 — 컴포넌트 내 비즈니스 로직 추출
- [ ] Q3 실행: Vitest 설치 및 `lib/api/` 단위 테스트 작성
- [ ] Q4 실행: `LibraryResult` 타입 및 빈 `EBOOK_LIBRARY_CONFIGS` 삭제
