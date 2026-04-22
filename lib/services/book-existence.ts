import "server-only";
import { unstable_cache } from "next/cache";
import {
  fetchLibrariesByBook,
  type Result,
} from "@/lib/api/data4library";
import { scrapeEbookAvailability } from "@/lib/api/ebook-scraper";
import type { Library } from "@/types";

// ============================================================================
// Tier 1: Physical ownership
// ============================================================================

export type PhysicalOwnership = {
  owningLibCodes: Set<string>;
};

export async function getPhysicalOwnership(
  isbn13: string,
): Promise<Result<PhysicalOwnership>> {
  const result = await fetchLibrariesByBook(isbn13);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { owningLibCodes: new Set(result.data.libCodes) },
  };
}

export function isOwnedBy(
  ownership: PhysicalOwnership,
  libCode: string,
): boolean {
  return ownership.owningLibCodes.has(libCode);
}

// ============================================================================
// Tier 2: Ebook existence (24h cache)
// ============================================================================

/**
 * libCode별 전자책 존재 상태.
 * - "exists": 전자책이 있음 (URL 제공 가능)
 * - "missing": 도서관에서 해당 도서의 전자책을 제공하지 않음
 * - "unavailable": 전자도서관 미운영 또는 조회 실패
 */
export type EbookStatus = "exists" | "missing" | "unavailable";

export type EbookInfo = {
  status: EbookStatus;
  ebookUrl: string | null;
};

export type EbookExistence = {
  /** libCode → EbookInfo. O(1) 조회 */
  infoByLibCode: Map<string, EbookInfo>;
};

/**
 * 캐시 메커니즘 선택: `unstable_cache`
 *
 * 이 서비스는 단일 fetch가 아니라 여러 단계(자동 발견 → 검색 URL fetch →
 * HTML 파싱)의 조합 결과를 캐싱해야 한다. `fetch`의 `next.revalidate`는
 * 개별 HTTP 요청 단위로만 동작하므로, 조합된 결과 캐싱에는 부적합하다.
 * `unstable_cache`는 임의의 async 함수 결과를 (bookTitle, libCode) 키로
 * 캐시할 수 있어 훨씬 더 적합하다. Next 16에서도 안정적으로 사용 가능.
 */
const ONE_DAY_SECONDS = 60 * 60 * 24;

async function scrapeEbookForLibrary(
  bookTitle: string,
  libCode: string,
  homepage: string,
): Promise<EbookInfo> {
  const result = await scrapeEbookAvailability(bookTitle, libCode, homepage);

  if (!result.success) {
    return { status: "unavailable", ebookUrl: null };
  }

  const { data } = result;
  if (data.ebookAvailable === "N") {
    return { status: "missing", ebookUrl: null };
  }

  return { status: "exists", ebookUrl: data.ebookUrl };
}

/**
 * 24시간 캐시가 적용된 도서관 단위 전자책 조회.
 *
 * 캐시 키: ["ebook-existence", bookTitle, libCode]
 * 태그: "ebook-existence", `ebook-existence:{libCode}` — 필요 시 부분 무효화.
 */
const getCachedEbookForLibrary = unstable_cache(
  scrapeEbookForLibrary,
  ["ebook-existence"],
  {
    revalidate: ONE_DAY_SECONDS,
    tags: ["ebook-existence"],
  },
);

/**
 * 주어진 책 제목에 대해 선택된 도서관 전체의 전자책 존재 여부를 조회한다.
 * 병렬 스크래핑 + 24h 캐시.
 */
export async function getEbookExistence(
  bookTitle: string,
  libraries: ReadonlyArray<Library>,
): Promise<Result<EbookExistence>> {
  if (!bookTitle.trim() || libraries.length === 0) {
    return {
      success: true,
      data: { infoByLibCode: new Map() },
    };
  }

  const settled = await Promise.allSettled(
    libraries.map((lib) =>
      getCachedEbookForLibrary(bookTitle, lib.libCode, lib.homepage),
    ),
  );

  const infoByLibCode = new Map<string, EbookInfo>();
  libraries.forEach((lib, index) => {
    const result = settled[index];
    if (result.status === "fulfilled") {
      infoByLibCode.set(lib.libCode, result.value);
    } else {
      infoByLibCode.set(lib.libCode, {
        status: "unavailable",
        ebookUrl: null,
      });
    }
  });

  return {
    success: true,
    data: { infoByLibCode },
  };
}

export function getEbookInfo(
  existence: EbookExistence,
  libCode: string,
): EbookInfo | null {
  return existence.infoByLibCode.get(libCode) ?? null;
}
