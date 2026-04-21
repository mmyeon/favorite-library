import Link from "next/link";

interface SearchHeaderProps {
  keyword: string;
  totalCount: number;
  libsParam: string;
}

export function SearchHeader({
  keyword,
  totalCount,
  libsParam,
}: SearchHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          검색 결과: {keyword}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{totalCount}건</p>
      </div>
      <Link
        href={`/?libs=${libsParam}`}
        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        돌아가기
      </Link>
    </header>
  );
}
