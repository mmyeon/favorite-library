"use client";

interface SelectedLibrary {
  libCode: string;
  libName: string;
}

interface SelectedLibraryBadgesProps {
  selectedLibraries: SelectedLibrary[];
  onRemove: (libCode: string) => void;
}

export function SelectedLibraryBadges({
  selectedLibraries,
  onRemove,
}: SelectedLibraryBadgesProps) {
  if (selectedLibraries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        도서관을 선택해주세요
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {selectedLibraries.map((lib) => (
        <li key={lib.libCode}>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-sm font-medium">
            {lib.libName}
            <button
              type="button"
              onClick={() => onRemove(lib.libCode)}
              aria-label={`${lib.libName} 선택 해제`}
              className="ml-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                className="size-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
