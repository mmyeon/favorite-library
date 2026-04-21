# Project Requirements

## Goal

Ship search results page (#5) and ebook URL auto-discovery (#9) for favorite-library, a Seoul library book availability aggregator. Search results stream availability per-book via Suspense. Ebook discovery auto-finds library ebook portal URLs from homepage HTML.

## Tech Stack

- Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / shadcn
- No authentication or user accounts
- Static HTML fetch only for ebook scraping (no JS rendering)

## Constraints

- No book detail page (issue #6 deferred)
- No saved library preferences (deferred)
- 5-second timeout on scraper requests
- In-memory caching (Map) for discovered ebook URLs

## Existing Architecture

### Pages
- `/` — Home page: library selector + search form → navigates to `/search?q=keyword&libs=code1,code2`
- `/search` — **TO BUILD** (Issue #5)

### API Routes
- `GET /api/libraries` — returns all Seoul libraries (cached 24h)
- `GET /api/books?keyword=X&pageNo=N` — searches books via 정보나루
- `GET /api/book-availability?isbn13=X&libCodes=a,b` — physical availability per library
- `GET /api/ebook-availability?keyword=X&libCodes=a,b` — ebook scraper (currently empty config)

### Key Files
- `lib/api/data4library.ts` — 정보나루 API client (searchBooks, fetchBookAvailability, fetchSeoulLibraries)
- `lib/api/ebook-scraper.ts` — ebook scraper (scrapeEbookAvailability, scrapeEbookAvailabilityBatch)
- `lib/constants/ebook-library-config.ts` — EBOOK_LIBRARY_CONFIGS (currently empty `{}`)
- `types/index.ts` — Book, Library, PhysicalAvailability, EbookAvailability, LibraryResult

### Patterns
- Server Components by default, `'use client'` only for interactivity
- URL params for state (libs=code1,code2)
- `lib/api/` for API clients, `lib/constants/` for config
- `components/` organized by feature (library/, search/)

---

## Issue #5 — Search Results Page

### Acceptance Criteria
- Book list renders immediately with loading skeletons for availability
- Each book has independent Suspense boundary (per-book streaming)
- Physical availability streams in per-book
- Ebook availability streams in per-book (slower, independent)
- Per-cell error isolation — failed scraper shows "전자책 정보 조회 불가" in that cell only
- "전자도서관 미운영" displayed for libraries without ebook portals
- Empty state shown when no search results found ("검색 결과 없음")
- Error boundary catches and displays errors gracefully
- Loading skeletons shown during availability fetch
- Availability links go directly to library lending page (not book detail)

### URL
`/search?q=keyword&libs=libCode1,libCode2`

### Architecture
- Server Component page reads searchParams
- Fetches books server-side via data4library
- Each book card wraps availability in Suspense
- Physical and ebook availability are independent async components per book

---

## Issue #9 — Ebook URL Auto-Discovery

### Acceptance Criteria
- Auto-discovers ebook portal URL from Library.homepage HTML
- Extracts href from links containing "전자도서관", "전자책", "e-Book", "디지털도서관"
- Maps discovered domains to search URL patterns (domainPatterns)
- Graceful degradation when discovery fails
- Broader library coverage beyond 마포중앙 and 구로 (validated across multiple districts)

### Architecture
- Fetch library homepage HTML
- Parse for ebook portal links using keyword matching
- Map known ebook platform domains to search URL templates
- Cache discovered URLs in-memory (Map)
- Integrate with existing ebook-scraper.ts
