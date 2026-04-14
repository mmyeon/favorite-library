"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { serializeLibCodes } from "@/lib/utils/url-params";

interface SearchFormProps {
  selectedLibCodes: string[];
}

export function SearchForm({ selectedLibCodes }: SearchFormProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  const isDisabled =
    selectedLibCodes.length === 0 || keyword.trim().length === 0;

  function handleSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isDisabled) return;

    const params = new URLSearchParams({
      q: keyword.trim(),
      libs: serializeLibCodes(selectedLibCodes),
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="책 제목 또는 저자를 입력하세요"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" disabled={isDisabled}>
          검색
        </Button>
      </div>
      {selectedLibCodes.length === 0 && (
        <p className="text-xs text-muted-foreground">
          검색하려면 도서관을 먼저 선택해주세요
        </p>
      )}
    </form>
  );
}
