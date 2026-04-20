"use client";

import Link from "next/link";

interface ErrorPageProps {
  reset: () => void;
}

export default function SearchError({ reset }: ErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-lg font-semibold">검색 중 오류가 발생했습니다</h1>
      <p className="text-sm text-muted-foreground">
        잠시 후 다시 시도해주세요
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
