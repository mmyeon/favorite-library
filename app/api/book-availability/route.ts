import { NextRequest, NextResponse } from "next/server";
import { fetchBookAvailability } from "@/lib/api/data4library";
import type { PhysicalAvailability } from "@/types";

type BookAvailabilityResponse = {
  success: boolean;
  data?: PhysicalAvailability[];
  error?: string;
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<BookAvailabilityResponse>> {
  const { searchParams } = request.nextUrl;
  const isbn13 = searchParams.get("isbn13")?.trim() ?? "";
  const libCodesParam = searchParams.get("libCodes")?.trim() ?? "";

  if (!isbn13) {
    return NextResponse.json(
      { success: false, error: "isbn13 is required" },
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

  try {
    const results = await Promise.allSettled(
      libCodes.map((libCode) => fetchBookAvailability(isbn13, libCode))
    );

    const data: PhysicalAvailability[] = results
      .filter(
        (r): r is PromiseFulfilledResult<PhysicalAvailability> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch book availability";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
