import { Suspense } from "react";
import { HomePageClient } from "@/components/HomePageClient";
import { fetchSeoulLibraries } from "@/lib/api/data4library";
import type { Library } from "@/types";

async function fetchLibraries(): Promise<Library[]> {
  try {
    return await fetchSeoulLibraries();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const libraries = await fetchLibraries();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          도서관 책 한 번에 찾기
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          서울 소재 도서관에서 빌리고 싶은 책을 검색해보세요.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">로딩 중...</div>
        }
      >
        <HomePageClient allLibraries={libraries} />
      </Suspense>
    </main>
  );
}
