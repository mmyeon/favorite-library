"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const isMaxReached = selectedLibCodes.length >= MAX_SELECTION;

  const filtered =
    query.trim().length > 0
      ? allLibraries.filter((lib) =>
          lib.libName.toLowerCase().includes(query.trim().toLowerCase())
        )
      : [];

  const selectableItems = filtered.filter(
    (lib) => !selectedLibCodes.includes(lib.libCode)
  );

  const handleSelect = useCallback(
    (lib: Library) => {
      if (selectedLibCodes.includes(lib.libCode)) return;
      if (isMaxReached) return;
      onSelectionChange([...selectedLibCodes, lib.libCode]);
      setQuery("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [selectedLibCodes, isMaxReached, onSelectionChange]
  );

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("li");
    items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || filtered.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          const lib = filtered[highlightedIndex];
          if (!selectedLibCodes.includes(lib.libCode)) {
            handleSelect(lib);
          }
        }
        break;
      }
      case "Escape": {
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      }
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const listboxId = "library-selector-listbox";

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
        onKeyDown={handleKeyDown}
        placeholder={
          isMaxReached
            ? `최대 ${MAX_SELECTION}개 선택됨`
            : "도서관 이름을 입력하세요 (예: 강남, 마포)"
        }
        disabled={isMaxReached}
        role="combobox"
        aria-expanded={isOpen && filtered.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `library-option-${filtered[highlightedIndex]?.libCode}`
            : undefined
        }
        aria-autocomplete="list"
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isMaxReached && "cursor-not-allowed opacity-50"
        )}
      />

      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-background shadow-md"
        >
          {filtered.map((lib, index) => {
            const isSelected = selectedLibCodes.includes(lib.libCode);
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={lib.libCode}
                id={`library-option-${lib.libCode}`}
                role="option"
                aria-selected={isHighlighted}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(lib)}
                  disabled={isSelected}
                  tabIndex={-1}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "cursor-default text-muted-foreground"
                      : "hover:bg-muted",
                    isHighlighted && !isSelected && "bg-muted"
                  )}
                >
                  <span>{lib.libName}</span>
                  {isSelected && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      선택됨
                    </span>
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
