import { NextRequest, NextResponse } from "next/server";
import { scrapeEbookAvailabilityBatch } from "@/lib/api/ebook-scraper";
import type { EbookScrapeResult, EbookScrapeTarget } from "@/lib/api/ebook-scraper";

type EbookAvailabilityResponse = {
  success: boolean;
  data?: EbookScrapeResult[];
  error?: string;
};

/**
 * Parses the `homepages` query param (JSON-encoded map of libCode -> homepage URL).
 * Returns an empty record on invalid input.
 */
function parseHomepages(raw: string | null): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) {
        result[key] = value.trim();
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<EbookAvailabilityResponse>> {
  const searchParams = new URL(request.url).searchParams;
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const libCodesParam = searchParams.get("libCodes")?.trim() ?? "";
  const homepagesParam = searchParams.get("homepages");

  if (!keyword) {
    return NextResponse.json(
      { success: false, error: "keyword is required" },
      { status: 400 }
    );
  }

  if (!libCodesParam) {
    return NextResponse.json(
      { success: false, error: "libCodes is required" },
      { status: 400 }
    );
  }

  const libCodes = libCodesParam
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  const homepages = parseHomepages(homepagesParam);

  const targets: EbookScrapeTarget[] = libCodes.map((libCode) => ({
    libCode,
    homepage: homepages[libCode],
  }));

  const data = await scrapeEbookAvailabilityBatch(keyword, targets);

  return NextResponse.json({ success: true, data });
}
