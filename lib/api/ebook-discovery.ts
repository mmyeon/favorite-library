import "server-only";

const DISCOVERY_TIMEOUT_MS = 5000;

const EBOOK_KEYWORDS = [
  "전자도서관",
  "전자책",
  "e-Book",
  "ebook",
  "eBook",
  "e-book",
  "디지털도서관",
  "전자자료",
];

/**
 * In-memory cache for discovered ebook URLs.
 * Key: library homepage URL, Value: discovered ebook URL or null.
 */
const ebookUrlCache = new Map<string, string | null>();

/**
 * Extracts ebook-related URLs from HTML by matching <a> tags whose
 * text content or href contains ebook keywords.
 */
function extractEbookLinks(html: string): string[] {
  // Match <a> tags with href attribute, capturing href and inner text
  const anchorRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const innerText = match[2];

    const hasKeyword = EBOOK_KEYWORDS.some(
      (kw) =>
        innerText.toLowerCase().includes(kw.toLowerCase()) ||
        href.toLowerCase().includes(kw.toLowerCase())
    );

    if (hasKeyword && href.startsWith("http")) {
      matches.push(href);
    }
  }

  return matches;
}

/**
 * Resolves a potentially relative URL against a base URL.
 */
function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

/**
 * Discovers the ebook portal URL by fetching a library's homepage HTML
 * and searching for links containing ebook-related keywords.
 *
 * Returns the discovered URL or null if not found / fetch fails.
 * Results are cached in memory.
 */
export async function discoverEbookUrl(
  homepage: string
): Promise<string | null> {
  // Check cache first
  if (ebookUrlCache.has(homepage)) {
    return ebookUrlCache.get(homepage) ?? null;
  }

  try {
    const response = await fetch(homepage, {
      signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; library-checker/1.0)",
      },
    });

    if (!response.ok) {
      ebookUrlCache.set(homepage, null);
      return null;
    }

    const html = await response.text();
    const links = extractEbookLinks(html);

    if (links.length === 0) {
      // Try extracting relative links as well
      const relativeRegex =
        /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let relMatch: RegExpExecArray | null;
      const relativeLinks: string[] = [];

      while ((relMatch = relativeRegex.exec(html)) !== null) {
        const href = relMatch[1];
        const innerText = relMatch[2];

        const hasKeyword = EBOOK_KEYWORDS.some(
          (kw) =>
            innerText.toLowerCase().includes(kw.toLowerCase()) ||
            href.toLowerCase().includes(kw.toLowerCase())
        );

        if (hasKeyword && !href.startsWith("http")) {
          relativeLinks.push(resolveUrl(href, homepage));
        }
      }

      if (relativeLinks.length > 0) {
        const result = relativeLinks[0];
        ebookUrlCache.set(homepage, result);
        return result;
      }

      ebookUrlCache.set(homepage, null);
      return null;
    }

    const result = links[0];
    ebookUrlCache.set(homepage, result);
    return result;
  } catch {
    ebookUrlCache.set(homepage, null);
    return null;
  }
}
