import { redirect } from "next/navigation";
import {
  searchBooks,
  fetchSeoulLibraries,
  BOOKS_PAGE_SIZE,
} from "@/lib/api/data4library";
import { getPhysicalOwnership } from "@/lib/services/book-existence";
import type { PhysicalOwnership } from "@/lib/services/book-existence";
import { SearchHeader } from "@/components/search/SearchHeader";
import { BookCard } from "@/components/search/BookCard";
import { EmptyState } from "@/components/search/EmptyState";
import { SearchPagination } from "@/components/search/SearchPagination";

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

  const ownershipResults = await Promise.allSettled(
    books.map((book) => getPhysicalOwnership(book.isbn13)),
  );

  const ownershipByIsbn = new Map<string, PhysicalOwnership | null>();
  books.forEach((book, index) => {
    const settled = ownershipResults[index];
    if (settled.status === "fulfilled" && settled.value.success) {
      ownershipByIsbn.set(book.isbn13, settled.value.data);
    } else {
      ownershipByIsbn.set(book.isbn13, null);
    }
  });

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
            {books.map((book) => (
              <BookCard
                key={book.isbn13}
                book={book}
                libraries={selectedLibraries}
                ownership={ownershipByIsbn.get(book.isbn13) ?? null}
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
