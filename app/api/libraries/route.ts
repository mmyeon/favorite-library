import { NextResponse } from "next/server";
import { fetchSeoulLibraries } from "@/lib/api/data4library";
import type { Library } from "@/types";

type LibrariesResponse = {
  success: boolean;
  data?: Library[];
  error?: string;
};

export const revalidate = 86400;

export async function GET(): Promise<NextResponse<LibrariesResponse>> {
  try {
    const libraries = await fetchSeoulLibraries();
    return NextResponse.json({ success: true, data: libraries });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch libraries";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
