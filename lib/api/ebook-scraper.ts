import "server-only";
import { EBOOK_LIBRARY_CONFIGS } from "@/lib/constants/ebook-library-config";
import { discoverEbookUrl } from "@/lib/api/ebook-discovery";
import { buildEbookSearchUrl } from "@/lib/constants/domain-patterns";
import type { Result } from "@/lib/api/data4library";

const TIMEOUT_MS = 5000;
const USER_AGENT = "Mozilla/5.0 (compatible; library-checker/1.0)";

/**
 * 전자책 스크래핑 결과 (data access layer).
 * fetch/parse만 담당하며 비즈니스 해석은 service layer에서 수행한다.
 *
 * - ebookUrl: 전자도서관 검색 URL (있을 경우)
 * - ebookAvailable: config 기반 판정이 가능한 경우만 "Y"/"N".
 *   자동 발견 경로에서는 HTML 구조를 모르므로 "Y" (URL 존재 = 있음 처리)
 */
export type EbookScrapeData = {
  libCode: string;
  libName: string;
  ebookAvailable: "Y" | "N";
  ebookUrl: string | null;
};

async function scrapeWithConfig(
  keyword: string,
  libCode: string,
): Promise<Result<EbookScrapeData>> {
  const config = EBOOK_LIBRARY_CONFIGS[libCode];
  if (!config) {
    return { success: false, error: "config 없음" };
  }

  try {
    const url = config.searchUrl(keyword);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      return { success: false, error: "조회 실패" };
    }

    const html = await response.text();
    const isEmpty = config.emptyTexts.some((text) => html.includes(text));

    if (isEmpty) {
      return {
        success: true,
        data: {
          libCode,
          libName: config.libName,
          ebookAvailable: "N",
          ebookUrl: null,
        },
      };
    }

    const isAvailable = config.availableTexts.some((text) =>
      html.includes(text),
    );

    return {
      success: true,
      data: {
        libCode,
        libName: config.libName,
        ebookAvailable: isAvailable ? "Y" : "N",
        ebookUrl: url,
      },
    };
  } catch {
    return { success: false, error: "조회 실패" };
  }
}

async function scrapeWithDiscovery(
  keyword: string,
  libCode: string,
  homepage: string,
): Promise<Result<EbookScrapeData>> {
  const ebookPortalUrl = await discoverEbookUrl(homepage);

  if (!ebookPortalUrl) {
    return { success: false, error: "전자도서관 미운영" };
  }

  const searchUrl = buildEbookSearchUrl(ebookPortalUrl, keyword);

  try {
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) {
      return {
        success: true,
        data: {
          libCode,
          libName: libCode,
          ebookAvailable: "Y",
          ebookUrl: ebookPortalUrl,
        },
      };
    }

    return {
      success: true,
      data: {
        libCode,
        libName: libCode,
        ebookAvailable: "Y",
        ebookUrl: searchUrl,
      },
    };
  } catch {
    return {
      success: true,
      data: {
        libCode,
        libName: libCode,
        ebookAvailable: "Y",
        ebookUrl: ebookPortalUrl,
      },
    };
  }
}

/**
 * 단일 도서관에 대해 전자책 스크래핑을 수행한다 (Result 패턴).
 *
 * - config가 정의된 도서관: HTML 분석으로 정확한 Y/N 판정
 * - config 없고 homepage 제공: 자동 발견 후 URL 반환 (Y로 처리)
 * - config 없고 homepage 없음: 실패 (전자도서관 미운영)
 */
export async function scrapeEbookAvailability(
  keyword: string,
  libCode: string,
  homepage?: string,
): Promise<Result<EbookScrapeData>> {
  if (EBOOK_LIBRARY_CONFIGS[libCode]) {
    return scrapeWithConfig(keyword, libCode);
  }

  if (homepage) {
    return scrapeWithDiscovery(keyword, libCode, homepage);
  }

  return { success: false, error: "전자도서관 미운영" };
}

// ============================================================================
// Legacy exports — 아래는 PR4에서 제거 예정. 기존 호출부(EbookAvailabilityCell,
// app/api/ebook-availability/route.ts) 호환을 위해 유지한다.
// ============================================================================

export type EbookScrapeResult =
  | {
      libCode: string;
      libName: string;
      ebookAvailable: "Y" | "N";
      ebookUrl?: string;
    }
  | { libCode: string; error: string };

export type EbookScrapeTarget = {
  libCode: string;
  homepage?: string;
};

function toLegacyResult(
  libCode: string,
  result: Result<EbookScrapeData>,
): EbookScrapeResult {
  if (!result.success) {
    return { libCode, error: result.error };
  }
  const { data } = result;
  const legacy: EbookScrapeResult = {
    libCode: data.libCode,
    libName: data.libName,
    ebookAvailable: data.ebookAvailable,
  };
  if (data.ebookUrl) {
    legacy.ebookUrl = data.ebookUrl;
  }
  return legacy;
}

/** @deprecated PR4에서 제거 예정. Result 패턴인 scrapeEbookAvailability 사용. */
export async function scrapeEbookAvailabilityLegacy(
  keyword: string,
  libCode: string,
  homepage?: string,
): Promise<EbookScrapeResult> {
  const result = await scrapeEbookAvailability(keyword, libCode, homepage);
  return toLegacyResult(libCode, result);
}

/** @deprecated PR4에서 제거 예정. */
export async function scrapeEbookAvailabilityBatch(
  keyword: string,
  targets: ReadonlyArray<EbookScrapeTarget>,
): Promise<EbookScrapeResult[]> {
  const results = await Promise.allSettled(
    targets.map((target) =>
      scrapeEbookAvailability(keyword, target.libCode, target.homepage),
    ),
  );

  return results.map((settled, index) => {
    const libCode = targets[index].libCode;
    if (settled.status === "fulfilled") {
      return toLegacyResult(libCode, settled.value);
    }
    return { libCode, error: "조회 실패" };
  });
}
