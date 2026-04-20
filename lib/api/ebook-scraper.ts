import "server-only";
import { EBOOK_LIBRARY_CONFIGS } from "@/lib/constants/ebook-library-config";
import { discoverEbookUrl } from "@/lib/api/ebook-discovery";
import { buildEbookSearchUrl } from "@/lib/constants/domain-patterns";

const TIMEOUT_MS = 5000;

export type EbookScrapeResult =
  | { libCode: string; libName: string; ebookAvailable: "Y" | "N"; ebookUrl?: string }
  | { libCode: string; error: string };

export type EbookScrapeTarget = {
  libCode: string;
  homepage?: string;
};

async function scrapeWithDiscovery(
  keyword: string,
  libCode: string,
  homepage: string
): Promise<EbookScrapeResult> {
  const ebookPortalUrl = await discoverEbookUrl(homepage);

  if (!ebookPortalUrl) {
    return { libCode, error: "전자도서관 미운영" };
  }

  const searchUrl = buildEbookSearchUrl(ebookPortalUrl, keyword);

  try {
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; library-checker/1.0)" },
    });

    if (!response.ok) {
      return { libCode, error: "조회 실패" };
    }

    // When using auto-discovery we cannot know the page's empty/available text
    // patterns, so we return the ebook URL for the user to check manually.
    return {
      libCode,
      libName: libCode,
      ebookAvailable: "Y",
      ebookUrl: searchUrl,
    };
  } catch {
    // Fetch failed but we did find the portal — still return the URL
    return {
      libCode,
      libName: libCode,
      ebookAvailable: "Y",
      ebookUrl: ebookPortalUrl,
    };
  }
}

export async function scrapeEbookAvailability(
  keyword: string,
  libCode: string,
  homepage?: string
): Promise<EbookScrapeResult> {
  const config = EBOOK_LIBRARY_CONFIGS[libCode];

  if (!config) {
    if (homepage) {
      return scrapeWithDiscovery(keyword, libCode, homepage);
    }
    return { libCode, error: "전자도서관 미운영" };
  }

  try {
    const url = config.searchUrl(keyword);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; library-checker/1.0)" },
    });

    if (!response.ok) {
      return { libCode, error: "조회 실패" };
    }

    const html = await response.text();
    const isEmpty = config.emptyTexts.some((text) => html.includes(text));

    if (isEmpty) {
      return { libCode, libName: config.libName, ebookAvailable: "N" };
    }

    const isAvailable = config.availableTexts.some((text) =>
      html.includes(text)
    );

    return {
      libCode,
      libName: config.libName,
      ebookAvailable: isAvailable ? "Y" : "N",
    };
  } catch {
    return { libCode, error: "조회 실패" };
  }
}

export async function scrapeEbookAvailabilityBatch(
  keyword: string,
  targets: ReadonlyArray<EbookScrapeTarget>
): Promise<EbookScrapeResult[]> {
  const results = await Promise.allSettled(
    targets.map((target) =>
      scrapeEbookAvailability(keyword, target.libCode, target.homepage)
    )
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return { libCode: targets[index].libCode, error: "조회 실패" };
  });
}
