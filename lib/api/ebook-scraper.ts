import "server-only";
import { EBOOK_LIBRARY_CONFIGS } from "@/lib/constants/ebook-library-config";

const TIMEOUT_MS = 5000;

export type EbookScrapeResult =
  | { libCode: string; libName: string; ebookAvailable: "Y" | "N" }
  | { libCode: string; error: string };

export async function scrapeEbookAvailability(
  keyword: string,
  libCode: string
): Promise<EbookScrapeResult> {
  const config = EBOOK_LIBRARY_CONFIGS[libCode];

  if (!config) {
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
  libCodes: string[]
): Promise<EbookScrapeResult[]> {
  const results = await Promise.allSettled(
    libCodes.map((libCode) => scrapeEbookAvailability(keyword, libCode))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    return { libCode: libCodes[index], error: "조회 실패" };
  });
}
