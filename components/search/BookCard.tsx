import { Suspense } from "react";
import Image from "next/image";
import { PhysicalAvailabilityCell } from "@/components/search/PhysicalAvailabilityCell";
import { EbookAvailabilityCell } from "@/components/search/EbookAvailabilityCell";
import { AvailabilitySkeleton } from "@/components/search/AvailabilitySkeleton";
import type { Book, Library } from "@/types";

interface BookCardProps {
  book: Book;
  libraries: Library[];
}

export function BookCard({ book, libraries }: BookCardProps) {
  return (
    <article className="rounded-lg border border-border p-4">
      <div className="flex gap-4">
        {book.bookImageURL && (
          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded">
            <Image
              src={book.bookImageURL}
              alt={book.title}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate text-base font-semibold">{book.title}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {book.author}
          </p>
          <p className="text-xs text-muted-foreground">
            {book.publisher}
            {book.publicationYear ? ` · ${book.publicationYear}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                구분
              </th>
              {libraries.map((lib) => (
                <th
                  key={lib.libCode}
                  className="px-3 py-2 text-xs font-medium text-muted-foreground"
                >
                  {lib.libName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                실물 도서
              </td>
              {libraries.map((lib) => (
                <td key={lib.libCode} className="px-3 py-2">
                  <Suspense fallback={<AvailabilitySkeleton />}>
                    <PhysicalAvailabilityCell
                      isbn13={book.isbn13}
                      libCode={lib.libCode}
                    />
                  </Suspense>
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                전자책
              </td>
              {libraries.map((lib) => (
                <td key={lib.libCode} className="px-3 py-2">
                  <Suspense fallback={<AvailabilitySkeleton />}>
                    <EbookAvailabilityCell
                      keyword={book.title}
                      libCode={lib.libCode}
                      homepage={lib.homepage}
                    />
                  </Suspense>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
