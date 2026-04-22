import { NextRequest, NextResponse } from "next/server";
import {
  checkLoanStatus,
  type CheckLoanStatusData,
} from "@/lib/services/book-availability";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type PostBody = {
  isbn13?: unknown;
  libCodes?: unknown;
};

function parseBody(raw: unknown):
  | { success: true; isbn13: string; libCodes: string[] }
  | { success: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { success: false, error: "Request body must be a JSON object" };
  }

  const body = raw as PostBody;

  if (typeof body.isbn13 !== "string" || body.isbn13.trim().length === 0) {
    return { success: false, error: "isbn13 is required" };
  }

  if (!Array.isArray(body.libCodes)) {
    return { success: false, error: "libCodes must be an array" };
  }

  const libCodes = body.libCodes
    .filter((code): code is string => typeof code === "string")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

  return { success: true, isbn13: body.isbn13.trim(), libCodes };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<CheckLoanStatusData>>> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = parseBody(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 },
    );
  }

  const result = await checkLoanStatus({
    isbn13: parsed.isbn13,
    libCodes: parsed.libCodes,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
