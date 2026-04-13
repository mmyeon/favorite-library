import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/lib/api/data4library";
import type { Book } from "@/types";

type BooksResponse = {
  success: boolean;
  data?: Book[];
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<BooksResponse>> {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get("keyword")?.trim() ?? "";
  const pageNo = Math.max(1, Number(searchParams.get("pageNo") ?? "1"));

  if (!keyword) {
    return NextResponse.json(
      { success: false, error: "keyword is required" },
      { status: 400 }
    );
  }

  try {
    const { books, total } = await searchBooks(keyword, pageNo);
    return NextResponse.json({
      success: true,
      data: books,
      meta: { total, page: pageNo, limit: 10 },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to search books";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
