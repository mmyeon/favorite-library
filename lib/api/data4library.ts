import "server-only";
import type { Book, Library, PhysicalAvailability } from "@/types";

const BASE_URL = "https://data4library.kr/api";
const SEOUL_REGION_CODE = "11";
export const BOOKS_PAGE_SIZE = 10;
const DEFAULT_TIMEOUT_MS = 5000;

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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
  bookname: string;
  authors: string;
  publisher: string;
  publication_year: string;
  isbn13: string;
  bookImageURL: string;
  description?: string;
};

type Data4LibraryAvailabilityResult = {
  hasBook: "Y" | "N";
  loanAvailable: "Y" | "N";
};

type Data4LibraryLibResponse = {
  response?: {
    numFound?: number;
    libs?: Array<{ lib: Data4LibraryLibItem }>;
  };
};

async function fetchLibrariesPage(
  pageSize: number,
): Promise<Data4LibraryLibResponse> {
  const url = buildUrl("/libSrch", {
    region: SEOUL_REGION_CODE,
    pageSize: String(pageSize),
  });
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Libraries API error: ${response.status}`);
  }

  return (await response.json()) as Data4LibraryLibResponse;
}

export async function fetchSeoulLibraries(): Promise<Library[]> {
  const peek = await fetchLibrariesPage(1);
  const total = peek.response?.numFound ?? 0;

  if (total === 0) {
    return [];
  }

  const full = await fetchLibrariesPage(total);
  const items = full.response?.libs ?? [];

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

const MAX_UPSTREAM_RESULTS = 200;

async function fetchBooksRaw(
  keyword: string,
  pageNo: number,
  pageSize: number,
): Promise<{ items: Array<{ doc: Data4LibraryBookItem }>; numFound: number }> {
  const url = buildUrl("/srchBooks", {
    keyword,
    pageNo: String(pageNo),
    pageSize: String(pageSize),
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

  return {
    items: json.response?.docs ?? [],
    numFound: json.response?.numFound ?? 0,
  };
}

export async function searchBooks(
  keyword: string,
  pageNo: number,
): Promise<{ books: Book[]; total: number }> {
  const first = await fetchBooksRaw(keyword, 1, MAX_UPSTREAM_RESULTS);
  const items = first.items;

  const books: Book[] = items.map(({ doc }) => ({
    title: doc.bookname,
    author: doc.authors,
    publisher: doc.publisher,
    publicationYear: doc.publication_year,
    isbn13: doc.isbn13,
    bookImageURL: doc.bookImageURL,
    description: doc.description ?? "",
  }));

  const normalized = keyword.trim().toLowerCase();
  const filtered = normalized
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(normalized) ||
          b.author.toLowerCase().includes(normalized),
      )
    : books;

  const start = (pageNo - 1) * BOOKS_PAGE_SIZE;
  const pageBooks = filtered.slice(start, start + BOOKS_PAGE_SIZE);

  return { books: pageBooks, total: filtered.length };
}

type Data4LibraryLibByBookResponse = {
  response?: {
    numFound?: number;
    libs?: Array<{ lib: { libCode: string; libName?: string } }>;
  };
};

export async function fetchLibrariesByBook(
  isbn13: string,
  region: string = SEOUL_REGION_CODE,
): Promise<Result<{ libCodes: string[] }>> {
  try {
    const url = buildUrl("/libSrchByBook", {
      isbn: isbn13,
      region,
    });
    const response = await fetch(url, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `libSrchByBook API error: ${response.status}`,
      };
    }

    const json = (await response.json()) as Data4LibraryLibByBookResponse;
    const items = json.response?.libs ?? [];
    const libCodes = items
      .map(({ lib }) => lib.libCode)
      .filter((code): code is string => Boolean(code));

    return { success: true, data: { libCodes } };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "libSrchByBook request failed";
    return { success: false, error: message };
  }
}

export async function fetchBookAvailability(
  isbn13: string,
  libCode: string,
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

export async function fetchBookLoanStatus(
  isbn13: string,
  libCode: string,
): Promise<Result<{ hasBook: "Y" | "N"; loanAvailable: "Y" | "N" }>> {
  try {
    const url = buildUrl("/bookExist", { isbn13, libCode });
    const response = await fetch(url, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `bookExist API error: ${response.status}`,
      };
    }

    const json = (await response.json()) as {
      response?: { result?: Data4LibraryAvailabilityResult };
    };

    const result = json.response?.result;
    if (!result) {
      return { success: false, error: "bookExist: empty result" };
    }

    return {
      success: true,
      data: { hasBook: result.hasBook, loanAvailable: result.loanAvailable },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "bookExist request failed";
    return { success: false, error: message };
  }
}
