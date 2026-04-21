# 코드베이스 진단 결과

생성일: 2026-04-20
Claude Code가 작성한 초안. 사람이 검토·수정 후 Step 2에서 사용.

---

## 📊 현재 코드베이스 관찰

### 프로젝트 개요

- **프레임워크**: Next.js 16.2.3 + React 19.2.4
- **스타일링**: Tailwind CSS 4, shadcn/ui (base-nova 스타일), class-variance-authority
- **언어**: TypeScript 5 (strict mode)
- **소스 파일 수**: 26개 (테스트 파일 0개)
- **UI 언어**: 한국어 / 커밋 메시지: 한국어

### 폴더별 역할과 파일 목록

#### `app/` — Next.js App Router (페이지 + API 라우트)

| 파일                                     | 역할                                                               | 서버/클라이언트 |
| ---------------------------------------- | ------------------------------------------------------------------ | --------------- |
| `layout.tsx` (23줄)                      | 루트 레이아웃, 폰트·메타데이터 설정                                | Server          |
| `page.tsx` (37줄)                        | 홈페이지 — `fetchSeoulLibraries()` 호출 후 `HomePageClient`에 전달 | Server (async)  |
| `globals.css`                            | 전역 Tailwind 스타일                                               | —               |
| `search/page.tsx` (60줄)                 | 검색 결과 페이지 — `Promise.all()`로 도서+도서관 병렬 조회         | Server (async)  |
| `search/error.tsx` (32줄)                | 검색 페이지 에러 바운더리                                          | Client          |
| `api/libraries/route.ts` (25줄)          | `GET /api/libraries` — 서울 도서관 목록 (ISR 24시간)               | API Route       |
| `api/books/route.ts` (45줄)              | `GET /api/books` — 키워드 도서 검색 (페이지네이션)                 | API Route       |
| `api/book-availability/route.ts` (60줄)  | `GET /api/book-availability` — 실물 도서 소장 여부                 | API Route       |
| `api/ebook-availability/route.ts` (74줄) | `GET /api/ebook-availability` — 전자책 가용 여부 (스크래핑)        | API Route       |

#### `components/` — React 컴포넌트

| 파일                                         | 역할                                               | 서버/클라이언트 | Props 타입 정의 방식                      |
| -------------------------------------------- | -------------------------------------------------- | --------------- | ----------------------------------------- |
| `HomePageClient.tsx` (70줄)                  | 홈 페이지 인터랙션 컨트롤러                        | Client          | `interface HomePageClientProps`           |
| `library/LibrarySelector.tsx` (197줄)        | 도서관 자동완성 드롭다운 (키보드 네비게이션, ARIA) | Client          | `interface LibrarySelectorProps`          |
| `library/SelectedLibraryBadges.tsx` (57줄)   | 선택된 도서관 배지 표시                            | Client          | 인라인 `interface` 2개                    |
| `search/BookCard.tsx` (95줄)                 | 도서 카드 + 소장 여부 테이블 (Suspense 래핑)       | Server (async)  | `interface BookCardProps`                 |
| `search/SearchForm.tsx` (50줄)               | 검색 입력 폼                                       | Client          | `interface SearchFormProps`               |
| `search/SearchHeader.tsx` (30줄)             | 검색 결과 헤더                                     | Server          | `interface SearchHeaderProps`             |
| `search/PhysicalAvailabilityCell.tsx` (27줄) | 실물 도서 소장/대출 상태 표시                      | Server (async)  | `interface PhysicalAvailabilityCellProps` |
| `search/EbookAvailabilityCell.tsx` (64줄)    | 전자책 가용 여부 표시                              | Server (async)  | `interface EbookAvailabilityCellProps`    |
| `search/AvailabilitySkeleton.tsx` (6줄)      | 로딩 스켈레톤                                      | —               | props 없음                                |
| `search/EmptyState.tsx` (22줄)               | 검색 결과 없음 상태                                | Server          | `interface EmptyStateProps`               |
| `ui/button.tsx` (58줄)                       | shadcn 버튼 (CVA variants)                         | —               | `ButtonPrimitive.Props & VariantProps`    |

#### `lib/` — API 클라이언트, 유틸리티, 상수

| 파일                                       | 역할                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `utils.ts` (6줄)                           | `cn()` — clsx + tailwind-merge                                                          |
| `utils/url-params.ts` (12줄)               | URL 파라미터 파싱/직렬화 (`parseLibCodes`, `serializeLibCodes`)                         |
| `api/data4library.ts` (163줄)              | 정보나루 API 클라이언트 — `fetchSeoulLibraries`, `searchBooks`, `fetchBookAvailability` |
| `api/ebook-scraper.ts` (121줄)             | 전자책 포탈 스크래핑 — `scrapeEbookAvailability`, `scrapeEbookAvailabilityBatch`        |
| `api/ebook-discovery.ts` (131줄)           | 전자도서관 URL 자동 발견 — `discoverEbookUrl`                                           |
| `constants/domain-patterns.ts` (77줄)      | 전자책 플랫폼 도메인→검색URL 매핑 (8개 플랫폼)                                          |
| `constants/ebook-library-config.ts` (13줄) | 도서관별 전자책 설정 (현재 빈 객체 `{}`)                                                |
| `constants/seoul-districts.ts` (33줄)      | 서울 25개 구 코드/이름 데이터                                                           |

#### `types/` — 타입 정의

| 파일              | 내용                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `index.ts` (39줄) | `Library`, `Book`, `PhysicalAvailability`, `EbookAvailability`, `LibraryResult` — 모두 `type` 키워드 사용, PascalCase |

### 외부 API 호출 코드 위치

모든 외부 API 호출은 `lib/api/` 에 집중되어 있으며, `import "server-only"` 가드가 적용됨.

| 파일                         | 대상                                      | 방식                                           | 타임아웃                       |
| ---------------------------- | ----------------------------------------- | ---------------------------------------------- | ------------------------------ |
| `lib/api/data4library.ts`    | `data4library.kr/api` (정보나루 공공 API) | `fetch()` — JSON 응답                          | 없음                           |
| `lib/api/ebook-scraper.ts`   | 각 도서관 전자책 포탈                     | `fetch()` — HTML 스크래핑                      | 5000ms (`AbortSignal.timeout`) |
| `lib/api/ebook-discovery.ts` | 도서관 홈페이지                           | `fetch()` — HTML 파싱으로 전자도서관 링크 발견 | 5000ms (`AbortSignal.timeout`) |

- 공통: 네이티브 `fetch()` 사용 (axios 없음), `User-Agent` 헤더는 스크래핑에만 설정
- 환경변수: `DATA4LIBRARY_API_KEY` 하나 (없으면 throw)
- 캐싱: ebook-discovery에 인메모리 `Map` 캐시, libraries API 라우트에 ISR 24시간

### 타입 정의 패턴

- **중앙 집중**: 모든 공유 타입은 `types/index.ts` 한 파일
- **네이밍**: PascalCase, 접두사(`I`, `T`) 없음
- **키워드**: 모든 타입이 `type` 사용 (`interface` 아님)
- **Props 타입**: 각 컴포넌트 파일 내부에 `interface`로 정의 (10/11 컴포넌트)
- **API 내부 타입**: `data4library.ts`에 `Data4Library` 접두사 붙인 내부 타입 4개 정의
- **스크래핑 타입**: `ebook-scraper.ts`에 `EbookScrapeResult` (discriminated union), `EbookScrapeTarget` 정의

### 에러 처리 패턴 (6가지 혼재)

| 패턴                              | 위치                                           | 설명                                                           |
| --------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| **1. 설정 에러 throw**            | `data4library.ts:9`                            | `if (!key) throw new Error("...not configured")`               |
| **2. HTTP 에러 throw**            | `data4library.ts:65,105`                       | `if (!response.ok) throw new Error("...API error: ${status}")` |
| **3. 조용한 null 반환**           | `data4library.ts:140`                          | `if (!response.ok) return null` — 에러 메시지 없음             |
| **4. 에러 객체 반환**             | `ebook-scraper.ts:31`                          | `catch { return { libCode, error: "조회 실패" } }`             |
| **5. try-catch + unknown 내로잉** | `api/books/route.ts`, `api/libraries/route.ts` | `error instanceof Error ? error.message : "기본 메시지"`       |
| **6. 조용한 catch + null 캐싱**   | `ebook-discovery.ts:77`                        | `catch { cache.set(key, null); return null }`                  |

### 컴포넌트 작성 패턴

- **서버 컴포넌트 우선**: 페이지와 데이터 표시 컴포넌트는 Server Component
- **클라이언트 최소화**: `"use client"`는 인터랙션이 필요한 5개 컴포넌트에만 적용
- **async 컴포넌트**: `BookCard`, `PhysicalAvailabilityCell`, `EbookAvailabilityCell`이 서버에서 비동기 데이터 로드
- **Suspense 활용**: `BookCard`가 가용 여부 셀을 `<Suspense>` + 스켈레톤으로 래핑
- **Props 패턴**: `interface XxxProps { ... }` → `function Xxx({ prop1, prop2 }: XxxProps)` — 일관적
- **URL 기반 상태**: 도서관 선택과 검색어를 URL 파라미터로 관리 (공유 가능)

### 기존 CLAUDE.md 내용

fullstack-orchestrator 하네스 설정만 포함. 코딩 규칙, 아키텍처 가이드, 리뷰 체크리스트 등은 없음.

---

## ⚠️ 발견된 불일치/개선점

### 1. 에러 처리 전략의 불일치

**동일한 `lib/api/` 폴더 내에서 3가지 다른 에러 전략 사용:**

- `data4library.ts` — 도서관/도서 조회: HTTP 에러 시 **throw** → 호출자가 try-catch 필수
- `data4library.ts` — 소장 여부 조회: HTTP 에러 시 **null 반환** → 호출자가 null 체크
- `ebook-scraper.ts` — 전자책 조회: 에러 시 **에러 객체 반환** (discriminated union) → 호출자가 `"error" in result` 체크

같은 API 클라이언트 모듈에서 throw와 null 반환을 혼용하면, 호출자가 어떤 에러 처리를 해야 하는지 함수 시그니처만으로 알 수 없다.

### 2. 비즈니스 로직과 프레젠테이션의 혼합

**`components/search/EbookAvailabilityCell.tsx`**:

- 에러 문자열 해석 로직이 컴포넌트 안에 존재 (`"전자도서관 미운영"` 문자열 매칭)
- 3가지 에러 케이스 + 2가지 성공 케이스의 분기를 컴포넌트가 직접 처리
- 이 로직은 비즈니스 규칙이며, 컴포넌트가 아닌 서비스 레이어에 있어야 함

**`components/HomePageClient.tsx:38-41`**:

- `selectedLibCodes`를 `allLibraries`에서 필터링·매핑하는 로직이 컴포넌트 내부에 존재
- `lib/utils/` 또는 별도 함수로 추출 가능

**`components/search/PhysicalAvailabilityCell.tsx`**:

- 소장 상태 해석 로직(hasBook/loanAvailable 조합)이 컴포넌트 안에 존재
- `EbookAvailabilityCell`과 같은 패턴이지만 에러 처리 방식이 다름 (try-catch 없음)

### 3. 에러 처리 누락

**`components/search/PhysicalAvailabilityCell.tsx`**:

- `fetchBookAvailability()` 호출에 **try-catch가 없음**
- 반면 같은 역할의 `EbookAvailabilityCell.tsx`는 try-catch로 감싸져 있음
- `fetchBookAvailability`가 throw할 수 있으므로 (API key 미설정 시) 런타임 에러 가능

### 4. 사용되지 않는 코드

**`types/index.ts` — `LibraryResult` 타입**:

- 정의되어 있지만 프로젝트 전체에서 import되거나 사용되는 곳이 없음
- 향후 사용 예정이라면 주석으로 명시 필요, 아니면 제거 대상

**`lib/constants/ebook-library-config.ts` — `EBOOK_LIBRARY_CONFIGS`**:

- 빈 객체 `{}`로 export — 현재 아무 도서관 설정도 없음
- `ebook-scraper.ts`에서 참조하지만 항상 fallback(auto-discovery)으로 빠짐
- 주석에 "issue #4 auto-discovery" 언급 — 의도적 placeholder인지 확인 필요

### 5. 데이터 fetch 패턴의 불일치

**`app/search/page.tsx`**: `Promise.all()` 사용 — 하나라도 실패하면 전체 실패
**`app/api/book-availability/route.ts`**: `Promise.allSettled()` 사용 — 개별 실패 허용

동일한 "병렬 조회" 상황에서 다른 전략을 사용. 검색 페이지에서 도서관 목록 조회 실패 시 전체 페이지가 에러 바운더리로 빠질 수 있음.

### 6. 테스트 부재

- 테스트 파일 0개, 테스트 러너 미설치
- `package.json`에 `test` 스크립트 없음
- `typecheck` (`tsc --noEmit`)만 존재

### 7. `search/page.tsx`의 데이터 조회 관심사

**`app/search/page.tsx`**:

- 페이지 컴포넌트가 직접 `searchBooks()`와 `fetchSeoulLibraries()` 호출
- 라이브러리 코드 파싱, 필터링 로직도 포함
- 순수 프레젠테이션이 아닌 데이터 조합 로직이 페이지에 존재

---

## 📜 제안 규칙 초안

### 아키텍처

- [x] **규칙 A1**: 3-tier를 다음과 같이 해석한다 — **Presentation** (`components/`, `app/**/page.tsx`), **Business Logic** (`lib/services/` — 신규), **Data Access** (`lib/api/`). 현재 `lib/api/`가 Data + Business를 겸하고 있으므로, 비즈니스 로직(에러 해석, 상태 조합)을 `lib/services/`로 분리한다. (근거: `EbookAvailabilityCell.tsx`의 에러 문자열 해석이 컴포넌트에 존재)

- [x] **규칙 A2**: 컴포넌트는 데이터의 **표시**만 담당한다. 에러 메시지 해석, 상태 조합, 필터링 로직은 `lib/services/` 또는 `lib/utils/`에 둔다. (근거: `PhysicalAvailabilityCell.tsx`의 hasBook/loanAvailable 분기, `HomePageClient.tsx:38-41`의 필터링)

- [x] **규칙 A3**: 페이지 컴포넌트(`app/**/page.tsx`)에서의 데이터 fetch는 허용하되, 데이터 **조합/변환** 로직이 5줄 이상이면 `lib/services/`로 추출한다. (근거: `search/page.tsx`의 라이브러리 파싱+필터링 로직)

### 폴더 구조

- [x] **규칙 F1**: 현재 폴더 구조를 유지하되, `lib/services/` 폴더를 추가한다:

  ```
  lib/
  ├── api/          # 외부 API 호출 (Data Access 계층) — fetch만 담당
  ├── services/     # 비즈니스 로직 (신규) — 데이터 해석, 조합, 변환
  ├── constants/    # 상수, 설정
  └── utils/        # 순수 유틸리티 함수
  ```

  (근거: 현재 `lib/api/`가 데이터 접근과 비즈니스 로직을 겸하고 있음)

- [x] **규칙 F2**: `components/` 하위 폴더는 기능(feature) 단위로 유지한다: `library/`, `search/`, `ui/`. 새 기능 추가 시 같은 패턴을 따른다. (근거: 현재 `library/`, `search/` 분리가 잘 되어 있음)

- [x] **규칙 F3**: 공유 타입은 `types/index.ts`에 유지한다. 단, 특정 모듈에서만 사용하는 내부 타입은 해당 파일 내에 정의한다. (근거: `data4library.ts`의 `Data4Library*` 내부 타입이 이미 이 패턴)

### API 호출

- [x] **규칙 D1**: `lib/api/` 함수의 에러 처리를 하나로 통일한다 — **Result 패턴**: `{ success: true, data: T } | { success: false, error: string }` 를 반환한다. throw는 프로그래머 에러(설정 누락)에만 사용한다. (근거: 현재 throw/null/에러객체가 혼재 — `data4library.ts` vs `ebook-scraper.ts`)

- [x] **규칙 D2**: 병렬 API 호출은 `Promise.allSettled()`로 통일한다. 개별 실패가 전체를 중단시키지 않도록 한다. (근거: `search/page.tsx`는 `Promise.all()` 사용, `book-availability/route.ts`는 `Promise.allSettled()` 사용 — 불일치)

- [x] **규칙 D3**: 외부 HTTP 요청에는 반드시 타임아웃을 설정한다. `AbortSignal.timeout()`을 사용하며, 기본값은 5000ms로 한다. (근거: `ebook-scraper.ts`와 `ebook-discovery.ts`는 5000ms 타임아웃 있음, `data4library.ts`는 타임아웃 없음)

- [x] **규칙 D4**: API 라우트(`app/api/`)의 응답 형식을 표준화한다: `{ success: boolean; data?: T; error?: string; meta?: { total, page, limit } }`. (근거: 현재 4개 API 라우트가 이미 이 형식을 따르고 있으므로, 이를 공식 규칙으로 명문화)

### 컴포넌트

- [x] **규칙 C1**: 기본은 Server Component. `"use client"`는 다음 경우에만 사용한다: (1) `useState`/`useEffect` 등 훅 사용, (2) 이벤트 핸들러 (`onClick`, `onChange`), (3) 브라우저 API 접근. (근거: 현재 프로젝트가 이미 이 패턴을 따르고 있음 — 5개 Client vs 6개 Server)

- [x] **규칙 C2**: Props 타입은 컴포넌트 파일 상단에 `interface XxxProps`로 정의한다. 인라인 타입 정의는 사용하지 않는다. (근거: 10/11 컴포넌트가 이 패턴, `SelectedLibraryBadges.tsx`만 인라인 2개 사용)

- [x] **규칙 C3**: async Server Component에서 외부 데이터를 호출할 때는 반드시 try-catch로 감싸고, 에러 시 사용자 친화적 fallback UI를 반환한다. (근거: `EbookAvailabilityCell.tsx`는 try-catch 있음, `PhysicalAvailabilityCell.tsx`는 없음 — 불일치)

- [x] **규칙 C4**: 한 컴포넌트 파일은 400줄을 넘지 않는다. 현재 가장 큰 컴포넌트는 `LibrarySelector.tsx` (197줄)로 적절한 범위. (근거: 현재 모든 컴포넌트가 200줄 이하)

### 네이밍

- [x] **규칙 N1**: 현재 네이밍 컨벤션을 공식화한다:
      | 대상 | 규칙 | 예시 |
      |------|------|------|
      | 컴포넌트 파일 | PascalCase.tsx | `BookCard.tsx`, `SearchForm.tsx` |
      | 유틸/상수 파일 | kebab-case.ts | `url-params.ts`, `domain-patterns.ts` |
      | API 라우트 | kebab-case 폴더 + `route.ts` | `book-availability/route.ts` |
      | 함수 | camelCase | `fetchSeoulLibraries`, `parseLibCodes` |
      | 상수 | UPPER_SNAKE_CASE | `BOOKS_PAGE_SIZE`, `SEOUL_REGION_CODE` |
      | 타입/인터페이스 | PascalCase | `Library`, `BookCardProps` |
      | 디렉토리 | kebab-case | `lib/api/`, `components/search/` |

  (근거: 프로젝트 전체 26개 파일이 이미 이 패턴을 일관되게 따르고 있음)

- [x] **규칙 N2**: 공유 타입은 `type` 키워드, Props 타입은 `interface` 키워드를 사용한다. (근거: `types/index.ts`는 모두 `type`, 컴포넌트 Props는 모두 `interface` — 현재 관행을 명문화)

- [x] **규칙 N3**: Import는 항상 `@/` 절대 경로를 사용한다. 상대 경로(`../`, `./`)는 같은 폴더 내 파일 간에만 허용한다. (근거: 현재 모든 import가 `@/` 사용 중)

### PR·리뷰

- [x] **규칙 P1**: PR 크기는 변경 줄 수 500줄 이하로 제한한다. 초과 시 분할을 우선 고려한다.

- [x] **규칙 P2**: 커밋 메시지는 `<type>: <한글 설명>` 형식을 따른다. type은 `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf` 중 하나. (근거: 기존 커밋 히스토리가 이 형식)

- [x] **규칙 P3**: 자가 리뷰 체크리스트 — PR 생성 전 다음을 확인한다:
  - [x] 새로 추가한 외부 API 호출에 타임아웃이 있는가?
  - [x] 에러 처리가 Result 패턴을 따르는가?
  - [x] 컴포넌트에 비즈니스 로직이 섞여 있지 않은가?
  - [x] async Server Component에 try-catch가 있는가?
  - [x] `"use client"`가 정말 필요한 컴포넌트에만 붙어 있는가?
  - [x] 사용하지 않는 타입/코드를 남기지 않았는가?
  - [x] Props 타입이 `interface`로 정의되어 있는가?
  - [x] Import가 `@/` 절대 경로를 사용하는가?
  - [x] 파일이 400줄을 넘지 않는가?

- [x] **규칙 P4**: 하나의 브랜치는 하나의 이슈만 다룬다. 작업 중 발견한 범위 밖 문제는 별도 이슈를 생성한다. (근거: `.claude/rules/common/development-workflow.md`의 Branch Scope Rule)

---

## ❓ 내가 결정해야 할 것들

### Q1. `lib/api/` 에러 처리 통일 전략

현재 3가지 패턴이 혼재함 (throw, null 반환, 에러 객체). 어떤 방향으로 통일할지:

선택지:

**답변:**

- A. **Result 패턴 통일**: 모든 `lib/api/` 함수가 `{ success: true, data } | { success: false, error }` 반환. throw는 프로그래머 에러(설정 누락)에만 사용.

### Q2. `lib/services/` 레이어 도입 시기

비즈니스 로직 분리를 위한 서비스 레이어를 언제 도입할지:

선택지:

**답변:**

- A. **즉시 도입**: 현재 컴포넌트에 있는 비즈니스 로직(`EbookAvailabilityCell`의 에러 해석, `PhysicalAvailabilityCell`의 상태 판단 등)을 `lib/services/availability.ts`로 추출.

### Q3. 테스트 전략

현재 테스트가 전혀 없음. 어떤 수준부터 시작할지:

선택지:

**답변:**

- A. **API 클라이언트 단위 테스트 우선**: `lib/api/` 함수들에 Vitest 단위 테스트 추가.

### Q4. 사용되지 않는 코드 처리

`LibraryResult` 타입과 빈 `EBOOK_LIBRARY_CONFIGS`의 처리:

선택지:

**답변:**

- A. **즉시 삭제**: 사용하지 않는 코드는 바로 제거. 필요할 때 다시 추가.

### Q5. 규칙 적용 범위

이 규칙들을 어디에 문서화할지:

선택지:

**답변:**

Phase 1 (지금): A로 시작. CLAUDE.md에 다 넣기. 빠르게 시작.
Phase 2 (나중): 자주 위반되는 규칙을 린트로 승격

---

## 📝 다음 단계

Step 2를 실행할 때 이 문서에서:

1. `[x]` 체크된 규칙들을 공식 규칙으로 확정
2. Q1~Q5의 답변을 반영
3. 확정된 규칙을 CLAUDE.md 또는 선택한 위치에 반영
4. 필요시 리팩토링 이슈 생성
