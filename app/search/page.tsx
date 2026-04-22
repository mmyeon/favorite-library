import { redirect } from "next/navigation";
import {
  searchBooks,
  fetchSeoulLibraries,
  BOOKS_PAGE_SIZE,
} from "@/lib/api/data4library";
import {
  getPhysicalOwnership,
  getEbookExistence,
} from "@/lib/services/book-existence";
import type {
  PhysicalOwnership,
  EbookExistence,
} from "@/lib/services/book-existence";
import { SearchHeader } from "@/components/search/SearchHeader";
import { BookCard } from "@/components/search/BookCard";
import { EmptyState } from "@/components/search/EmptyState";
import { SearchPagination } from "@/components/search/SearchPagination";
import type { Book, Library } from "@/types";

type PerBookTier = {
  ownership: PhysicalOwnership | null;
  ebook: EbookExistence | null;
};

/**
 * 책 1권에 대해 Tier 1(실물 소장)과 Tier 2(전자책 존재)를 병렬로 조회한다.
 * 하나가 실패해도 다른 Tier는 영향받지 않는다.
 */
async function fetchTiersForBook(
  book: Book,
  libraries: ReadonlyArray<Library>,
): Promise<PerBookTier> {
  const [ownershipSettled, ebookSettled] = await Promise.allSettled([
    getPhysicalOwnership(book.isbn13),
    getEbookExistence(book.title, libraries),
  ]);

  const ownership =
    ownershipSettled.status === "fulfilled" && ownershipSettled.value.success
      ? ownershipSettled.value.data
      : null;

  const ebook =
    ebookSettled.status === "fulfilled" && ebookSettled.value.success
      ? ebookSettled.value.data
      : null;

  return { ownership, ebook };
}

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; libs?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const keyword = searchParams.q?.trim();
  const libsParam = searchParams.libs?.trim();
  const parsedPage = Number.parseInt(searchParams.page ?? "1", 10);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  if (!keyword || !libsParam) {
    redirect("/");
  }

  const selectedLibCodes = libsParam
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);

  if (selectedLibCodes.length === 0) {
    redirect("/");
  }

  const [{ books, total }, allLibraries] = await Promise.all([
    searchBooks(keyword, currentPage),
    fetchSeoulLibraries(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / BOOKS_PAGE_SIZE));

  const selectedLibraries = allLibraries.filter((lib) =>
    selectedLibCodes.includes(lib.libCode),
  );

  // 책별로 Tier 1 + Tier 2 병렬 조회. 책 간에도 Promise.all로 병렬화.
  const tiers = await Promise.all(
    books.map((book) => fetchTiersForBook(book, selectedLibraries)),
  );

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <SearchHeader
        keyword={keyword}
        totalCount={total}
        libsParam={libsParam}
      />

      {books.length === 0 ? (
        <EmptyState libsParam={libsParam} />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {books.map((book, index) => (
              <BookCard
                key={book.isbn13}
                book={book}
                libraries={selectedLibraries}
                ownership={tiers[index].ownership}
                ebook={tiers[index].ebook}
              />
            ))}
          </div>
          <SearchPagination
            keyword={keyword}
            libsParam={libsParam}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </>
      )}
    </main>
  );
}
