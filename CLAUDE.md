# favorite-library

## 하네스: 풀스택 웹사이트 개발

**목표:** 와이어프레임부터 Vercel 배포까지 디자인→프론트엔드→백엔드→QA→배포 파이프라인을 자동 조율

**트리거:** 웹사이트/앱 개발, 기능 추가, 디자인·API·배포 수정 요청 시 `fullstack-orchestrator` 스킬을 사용하라. 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-04-13 | 초기 구성 | 전체 | 풀스택 개발 파이프라인 하네스 구축 |
| 2026-04-20 | 코딩 규칙 v1 반영 | CLAUDE.md | 01-diagnosis.md 기반 20개 규칙 확정 |

---

## 🏛 아키텍처 원칙

- **3-tier 구조**: Presentation (`components/`, `app/**/page.tsx`) → Business Logic (`lib/services/`) → Data Access (`lib/api/`)
  - `lib/api/`는 외부 API 호출(fetch)만 담당한다. 데이터 해석·조합은 `lib/services/`에 둔다.
  - 예: 전자책 가용 여부 에러 해석 → `lib/services/availability.ts`, fetch → `lib/api/ebook-scraper.ts`
- **컴포넌트는 표시만**: 에러 메시지 해석, 상태 조합, 필터링 로직은 `lib/services/` 또는 `lib/utils/`에 둔다.
  - 예: `hasBook/loanAvailable` 분기 → `lib/services/`로 추출, 컴포넌트는 결과만 렌더링
- **페이지 데이터 변환 제한**: `app/**/page.tsx`에서 데이터 fetch는 허용하되, 데이터 조합/변환 로직이 **5줄 이상**이면 `lib/services/`로 추출한다.
  - 예: `search/page.tsx`의 라이브러리 파싱+필터링 → `lib/services/search.ts`로 추출

## 📁 폴더 구조 규칙

```
lib/
├── api/          # 외부 API 호출 (Data Access) — fetch만 담당
├── services/     # 비즈니스 로직 — 데이터 해석, 조합, 변환
├── constants/    # 상수, 설정 (domain-patterns.ts, seoul-districts.ts 등)
└── utils/        # 순수 유틸리티 함수 (url-params.ts 등)

components/
├── library/      # 도서관 관련 (LibrarySelector, SelectedLibraryBadges)
├── search/       # 검색 관련 (BookCard, SearchForm, SearchHeader 등)
└── ui/           # 공통 UI (button 등 shadcn 컴포넌트)

types/
└── index.ts      # 공유 타입 (Library, Book 등)
```

- **기능(feature) 단위** 폴더 구조를 유지한다. 새 기능 추가 시 같은 패턴을 따른다.
- **공유 타입**은 `types/index.ts`에 둔다. 특정 모듈 전용 내부 타입은 해당 파일 내에 정의한다.
  - 예: `Data4LibraryBook` → `lib/api/data4library.ts` 내부 정의, `Book` → `types/index.ts`

## 💻 코드 작성 규칙

### API 호출

- **Result 패턴**: `lib/api/` 함수는 `{ success: true, data: T } | { success: false, error: string }`을 반환한다. `throw`는 프로그래머 에러(설정 누락 등)에만 사용한다.
  - 예: `fetchBookAvailability()` → `{ success: true, data: { hasBook, loanAvailable } }` 또는 `{ success: false, error: "API 응답 실패" }`
- **병렬 호출은 `Promise.allSettled()`**: 개별 실패가 전체를 중단시키지 않도록 한다.
  - 예: `search/page.tsx`에서 도서+도서관 병렬 조회 시 `Promise.allSettled()` 사용
- **타임아웃 필수**: 외부 HTTP 요청에는 `AbortSignal.timeout(5000)` 설정. 기본값 5000ms.
- **API 라우트 응답 표준**: `app/api/` 핸들러는 `{ success: boolean; data?: T; error?: string; meta?: { total, page, limit } }` 형식으로 응답한다.

### 컴포넌트

- **Server Component 기본**: `"use client"`는 (1) 훅 사용, (2) 이벤트 핸들러, (3) 브라우저 API 접근 시에만 붙인다.
- **Props 타입**: 컴포넌트 파일 상단에 `interface XxxProps`로 정의. 인라인 타입 금지.
  - 예: `interface BookCardProps { book: Book; libCodes: string[] }`
- **async Server Component 에러 처리**: 외부 데이터 호출 시 반드시 `try-catch`로 감싸고, 에러 시 사용자 친화적 fallback UI를 반환한다.
- **파일 크기 제한**: 한 컴포넌트 파일은 **400줄**을 넘지 않는다.

### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase.tsx | `BookCard.tsx`, `SearchForm.tsx` |
| 유틸/상수 파일 | kebab-case.ts | `url-params.ts`, `domain-patterns.ts` |
| API 라우트 | kebab-case 폴더 + `route.ts` | `book-availability/route.ts` |
| 함수 | camelCase | `fetchSeoulLibraries`, `parseLibCodes` |
| 상수 | UPPER_SNAKE_CASE | `BOOKS_PAGE_SIZE`, `SEOUL_REGION_CODE` |
| 타입/인터페이스 | PascalCase | `Library`, `BookCardProps` |
| 디렉토리 | kebab-case | `lib/api/`, `components/search/` |

- **타입 키워드 구분**: 공유 타입은 `type`, Props 타입은 `interface`
- **Import 경로**: `@/` 절대 경로 사용. 상대 경로(`./`, `../`)는 같은 폴더 내에서만 허용.

## 📏 PR 규칙

- **PR 크기**: 변경 줄 수 **500줄 이하**. 초과 시 분할 우선.
- **커밋 메시지**: `<type>: <한글 설명>` — type은 `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf` 중 선택.
  - 예: `feat: 도서관 자동완성 키보드 네비게이션 추가`
- **브랜치 범위**: 하나의 브랜치는 하나의 이슈만 다룬다. 범위 밖 문제 발견 시 별도 이슈 생성.

## ✅ 자가 리뷰 체크리스트

PR 생성 전 반드시 확인:

- [ ] 새로 추가한 외부 API 호출에 타임아웃(`AbortSignal.timeout`)이 있는가?
- [ ] 에러 처리가 Result 패턴(`{ success, data/error }`)을 따르는가?
- [ ] 컴포넌트에 비즈니스 로직(에러 해석, 상태 조합)이 섞여 있지 않은가?
- [ ] async Server Component에 try-catch가 있는가?
- [ ] `"use client"`가 정말 필요한 컴포넌트에만 붙어 있는가?
- [ ] 사용하지 않는 타입/코드를 남기지 않았는가?
- [ ] Props 타입이 `interface`로 정의되어 있는가?
- [ ] Import가 `@/` 절대 경로를 사용하는가?
- [ ] 파일이 400줄을 넘지 않는가?
