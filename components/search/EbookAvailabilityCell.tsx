import { scrapeEbookAvailability } from "@/lib/api/ebook-scraper";

interface EbookAvailabilityCellProps {
  keyword: string;
  libCode: string;
  homepage: string;
}

export async function EbookAvailabilityCell({
  keyword,
  libCode,
  homepage,
}: EbookAvailabilityCellProps) {
  try {
    const result = await scrapeEbookAvailability(keyword, libCode, homepage);

    if ("error" in result) {
      if (result.error === "전자도서관 미운영") {
        return (
          <span className="text-sm text-muted-foreground">
            전자도서관 미운영
          </span>
        );
      }
      return (
        <span className="text-sm text-muted-foreground">
          전자책 정보 조회 불가
        </span>
      );
    }

    if (result.ebookAvailable === "Y") {
      if (result.ebookUrl) {
        return (
          <a
            href={result.ebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-green-600 underline underline-offset-4 hover:text-green-700"
          >
            전자책 (대출가능)
          </a>
        );
      }
      return (
        <span className="text-sm font-medium text-green-600">
          전자책 (대출가능)
        </span>
      );
    }

    return (
      <span className="text-sm font-medium text-yellow-600">
        전자책 (대출중)
      </span>
    );
  } catch {
    return (
      <span className="text-sm text-muted-foreground">
        전자책 정보 조회 불가
      </span>
    );
  }
}
