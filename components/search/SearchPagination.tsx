import Link from "next/link";

interface SearchPaginationProps {
  keyword: string;
  libsParam: string;
  currentPage: number;
  totalPages: number;
}

function buildHref(
  keyword: string,
  libsParam: string,
  page: number,
): string {
  const params = new URLSearchParams({
    q: keyword,
    libs: libsParam,
    page: String(page),
  });
  return `/search?${params.toString()}`;
}

export function SearchPagination({
  keyword,
  libsParam,
  currentPage,
  totalPages,
}: SearchPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      className="mt-8 flex items-center justify-between"
      aria-label="검색 결과 페이지"
    >
      {hasPrev ? (
        <Link
          href={buildHref(keyword, libsParam, currentPage - 1)}
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
        >
          이전
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">이전</span>
      )}

      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={buildHref(keyword, libsParam, currentPage + 1)}
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
        >
          다음
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">다음</span>
      )}
    </nav>
  );
}
