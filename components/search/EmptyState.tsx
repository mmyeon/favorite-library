import Link from "next/link";

interface EmptyStateProps {
  libsParam: string;
}

export function EmptyState({ libsParam }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h2 className="text-lg font-semibold">검색 결과 없음</h2>
      <p className="text-sm text-muted-foreground">
        다른 검색어를 입력해주세요
      </p>
      <Link
        href={`/?libs=${libsParam}`}
        className="mt-2 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
