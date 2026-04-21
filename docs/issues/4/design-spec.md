# Search Results Page — Design Spec

## Page Layout

```
/search?q=keyword&libs=code1,code2

┌─────────────────────────────────────────────┐
│ ← 검색 결과: "keyword"         N건          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📖 Book Title                       │    │
│  │ Author · Publisher · Year           │    │
│  │                                     │    │
│  │ ┌──────────┬──────────┬──────────┐  │    │
│  │ │ 도서관A  │ 도서관B  │ 도서관C  │  │    │
│  │ ├──────────┼──────────┼──────────┤  │    │
│  │ │ 소장(대출)│ ░░░░░░ │ 미소장    │  │    │
│  │ │ 가능     │(loading)│          │  │    │
│  │ ├──────────┼──────────┼──────────┤  │    │
│  │ │ 전자책   │ ░░░░░░ │ 전자도서관│  │    │
│  │ │ 대출가능  │(loading)│ 미운영   │  │    │
│  │ └──────────┴──────────┴──────────┘  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📖 Book Title 2                     │    │
│  │ ...                                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

## Empty State
```
┌─────────────────────────────────────────────┐
│ 검색 결과: "xyz"                            │
│                                             │
│         검색 결과 없음                       │
│   다른 검색어를 입력해주세요                   │
│                                             │
└─────────────────────────────────────────────┘
```

## Component Tree

```
app/search/page.tsx (Server Component)
├── SearchHeader (keyword, total count)
├── BookList
│   └── BookCard[] (Server Component — maps over books)
│       ├── BookInfo (title, author, publisher, year — renders immediately)
│       └── AvailabilityTable
│           └── For each selected library:
│               ├── <Suspense fallback={<AvailabilitySkeleton/>}>
│               │   └── PhysicalAvailabilityCell (async Server Component)
│               └── <Suspense fallback={<AvailabilitySkeleton/>}>
│                   └── EbookAvailabilityCell (async Server Component)
└── EmptyState (when books.length === 0)
```

## Component Breakdown

### 1. `app/search/page.tsx`
- Server Component
- Reads `searchParams.q` and `searchParams.libs`
- Validates params (redirect to `/` if missing)
- Calls `searchBooks(keyword, 1)` server-side
- Renders BookList or EmptyState

### 2. `components/search/SearchHeader.tsx`
- Displays "검색 결과: {keyword}" and total count
- Back link to home page

### 3. `components/search/BookCard.tsx`
- Server Component
- Displays book metadata (title, author, publisher, year)
- Contains availability table with Suspense boundaries

### 4. `components/search/AvailabilityTable.tsx`
- Grid/table layout for per-library availability
- Column per selected library
- Two rows: physical, ebook

### 5. `components/search/PhysicalAvailabilityCell.tsx`
- Async Server Component
- Calls `fetchBookAvailability(isbn13, libCode)` directly
- Shows: 소장(대출가능) / 소장(대출중) / 미소장

### 6. `components/search/EbookAvailabilityCell.tsx`
- Async Server Component
- Calls ebook discovery + scraper
- Shows: 전자책 대출가능 / 전자책 대출중 / 전자도서관 미운영
- Error: "전자책 정보 조회 불가"

### 7. `components/search/AvailabilitySkeleton.tsx`
- Animated skeleton placeholder for loading state

### 8. `components/search/EmptyState.tsx`
- "검색 결과 없음" message

## States per Availability Cell

| State | Physical | Ebook |
|-------|----------|-------|
| Loading | Skeleton | Skeleton |
| Has + Available | "소장 (대출가능)" link | "전자책 (대출가능)" link |
| Has + Unavailable | "소장 (대출중)" | "전자책 (대출중)" |
| Not Found | "미소장" | — |
| Not Supported | — | "전자도서관 미운영" |
| Error | "조회 실패" | "전자책 정보 조회 불가" |

## Data Flow

1. Page loads → books fetched server-side (instant render)
2. Per book × per library: Suspense boundary starts streaming
3. Physical availability: direct call to 정보나루 API
4. Ebook availability: discover portal URL → scrape → return result
5. Each cell resolves independently — no waterfall
