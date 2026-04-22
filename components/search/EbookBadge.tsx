import type { EbookExistence } from "@/lib/services/book-existence";
import { getEbookInfo } from "@/lib/services/book-existence";

interface EbookBadgeProps {
  ebook: EbookExistence | null;
  libCode: string;
}

export function EbookBadge({ ebook, libCode }: EbookBadgeProps) {
  if (ebook === null) {
    return <span className="text-sm text-muted-foreground">조회 실패</span>;
  }

  const info = getEbookInfo(ebook, libCode);

  if (info === null || info.status === "unavailable") {
    return <span className="text-sm text-muted-foreground">조회 실패</span>;
  }

  if (info.status === "missing") {
    return <span className="text-sm text-muted-foreground">없음</span>;
  }

  if (info.ebookUrl) {
    return (
      <a
        href={info.ebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-green-600 underline underline-offset-4 hover:text-green-700"
      >
        있음
      </a>
    );
  }

  return <span className="text-sm font-medium text-green-600">있음</span>;
}
