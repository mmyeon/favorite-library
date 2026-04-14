"use client";

import { useState, useRef, useEffect } from "react";
import type { Library } from "@/types";
import { cn } from "@/lib/utils";

const MAX_SELECTION = 7;

interface LibrarySelectorProps {
  allLibraries: Library[];
  selectedLibCodes: string[];
  onSelectionChange: (libCodes: string[]) => void;
}

export function LibrarySelector({
  allLibraries,
  selectedLibCodes,
  onSelectionChange,
}: LibrarySelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMaxReached = selectedLibCodes.length >= MAX_SELECTION;

  const filtered =
    query.trim().length > 0
      ? allLibraries.filter((lib) =>
          lib.libName.toLowerCase().includes(query.trim().toLowerCase())
        )
      : [];

  function handleSelect(lib: Library) {
    if (selectedLibCodes.includes(lib.libCode)) return;
    if (isMaxReached) return;
    onSelectionChange([...selectedLibCodes, lib.libCode]);
    setQuery("");
    setIsOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.trim().length > 0 && setIsOpen(true)}
        placeholder={
          isMaxReached
            ? `최대 ${MAX_SELECTION}개 선택됨`
            : "도서관 이름을 입력하세요 (예: 강남, 마포)"
        }
        disabled={isMaxReached}
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMaxReached && "cursor-not-allowed opacity-50"
        )}
      />

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background shadow-md">
          {filtered.map((lib) => {
            const isSelected = selectedLibCodes.includes(lib.libCode);
            return (
              <li key={lib.libCode}>
                <button
                  type="button"
                  onClick={() => handleSelect(lib)}
                  disabled={isSelected}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "cursor-default text-muted-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span>{lib.libName}</span>
                  {isSelected && (
                    <span className="ml-2 text-xs text-muted-foreground">선택됨</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && query.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground shadow-md">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
