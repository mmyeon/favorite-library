"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LibrarySelector } from "@/components/library/LibrarySelector";
import { SelectedLibraryBadges } from "@/components/library/SelectedLibraryBadges";
import { SearchForm } from "@/components/search/SearchForm";
import { parseLibCodes, serializeLibCodes } from "@/lib/utils/url-params";
import type { Library } from "@/types";

interface HomePageClientProps {
  allLibraries: Library[];
}

export function HomePageClient({ allLibraries }: HomePageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLibCodes, setSelectedLibCodes] = useState<string[]>(() =>
    parseLibCodes(searchParams),
  );

  function handleSelectionChange(libCodes: string[]) {
    setSelectedLibCodes(libCodes);

    const params = new URLSearchParams(searchParams.toString());
    if (libCodes.length > 0) {
      params.set("libs", serializeLibCodes(libCodes));
    } else {
      params.delete("libs");
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  function handleRemove(libCode: string) {
    handleSelectionChange(selectedLibCodes.filter((code) => code !== libCode));
  }

  const selectedLibraries = selectedLibCodes
    .map((code) => allLibraries.find((lib) => lib.libCode === code))
    .filter((lib): lib is Library => lib !== undefined)
    .map((lib) => ({ libCode: lib.libCode, libName: lib.libName }));

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="도서관 검색">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          도서관 검색
        </h2>
        {selectedLibraries.length > 0 && (
          <div className="mb-3">
            <SelectedLibraryBadges
              selectedLibraries={selectedLibraries}
              onRemove={handleRemove}
            />
          </div>
        )}
        <LibrarySelector
          allLibraries={allLibraries}
          selectedLibCodes={selectedLibCodes}
          onSelectionChange={handleSelectionChange}
        />
      </section>

      <section aria-label="책 검색">
        <h2 className="mb-2 text-sm font-medium text-foreground">책 검색</h2>
        <SearchForm selectedLibCodes={selectedLibCodes} />
      </section>
    </div>
  );
}
