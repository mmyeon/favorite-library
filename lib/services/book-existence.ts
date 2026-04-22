import "server-only";
import {
  fetchLibrariesByBook,
  type Result,
} from "@/lib/api/data4library";

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
