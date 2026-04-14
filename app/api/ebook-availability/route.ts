import { NextRequest, NextResponse } from "next/server";
import { scrapeEbookAvailabilityBatch } from "@/lib/api/ebook-scraper";
import type { EbookScrapeResult } from "@/lib/api/ebook-scraper";

type EbookAvailabilityResponse = {
  success: boolean;
  data?: EbookScrapeResult[];
  error?: string;
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<EbookAvailabilityResponse>> {
  const searchParams = new URL(request.url).searchParams;
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const libCodesParam = searchParams.get("libCodes")?.trim() ?? "";

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

  const data = await scrapeEbookAvailabilityBatch(keyword, libCodes);

  return NextResponse.json({ success: true, data });
}
