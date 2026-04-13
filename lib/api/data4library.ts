import "server-only";
import type { Book, Library, PhysicalAvailability } from "@/types";

const BASE_URL = "https://data4library.kr/api";
const SEOUL_REGION_CODE = "11";
export const BOOKS_PAGE_SIZE = 10;

function getApiKey(): string {
  const key = process.env.DATA4LIBRARY_API_KEY;
  if (!key) {
    throw new Error("DATA4LIBRARY_API_KEY is not configured");
  }
  return key;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("authKey", getApiKey());
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

type Data4LibraryLibItem = {
  libCode: string;
  libName: string;
  address: string;
  tel: string;
  homepage: string;
  closed: string;
  operatingTime: string;
};

type Data4LibraryBookItem = {
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  isbn13: string;
  bookImageURL: string;
  description: string;
};

type Data4LibraryAvailabilityResult = {
  hasBook: "Y" | "N";
  loanAvailable: "Y" | "N";
};

export async function fetchSeoulLibraries(): Promise<Library[]> {
  const url = buildUrl("/libSrch", { region: SEOUL_REGION_CODE });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Libraries API error: ${response.status}`);
  }

  const json = (await response.json()) as {
    response?: {
      libs?: Array<{ lib: Data4LibraryLibItem }>;
    };
  };

  const items = json.response?.libs ?? [];
  return items.map(({ lib }) => ({
    libCode: lib.libCode,
    libName: lib.libName,
    address: lib.address,
    tel: lib.tel,
    homepage: lib.homepage,
    closed: lib.closed,
    operatingTime: lib.operatingTime,
  }));
}

export async function searchBooks(
  keyword: string,
  pageNo: number
): Promise<{ books: Book[]; total: number }> {
  const url = buildUrl("/srchBooks", {
    keyword,
    pageNo: String(pageNo),
    pageSize: String(BOOKS_PAGE_SIZE),
  });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Books API error: ${response.status}`);
  }

  const json = (await response.json()) as {
    response?: {
      numFound?: number;
      docs?: Array<{ doc: Data4LibraryBookItem }>;
    };
  };

  const items = json.response?.docs ?? [];
  const total = json.response?.numFound ?? 0;

  return {
    books: items.map(({ doc }) => ({
      title: doc.title,
      author: doc.author,
      publisher: doc.publisher,
      publicationYear: doc.publicationYear,
      isbn13: doc.isbn13,
      bookImageURL: doc.bookImageURL,
      description: doc.description,
    })),
    total,
  };
}

export async function fetchBookAvailability(
  isbn13: string,
  libCode: string
): Promise<PhysicalAvailability | null> {
  const url = buildUrl("/bookExist", { isbn13, libCode });
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as {
    response?: {
      result?: Data4LibraryAvailabilityResult;
      libCode?: string;
      libName?: string;
    };
  };

  const result = json.response?.result;
  if (!result) return null;

  return {
    libCode,
    libName: json.response?.libName ?? "",
    hasBook: result.hasBook,
    loanAvailable: result.loanAvailable,
  };
}
