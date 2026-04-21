const EBOOK_KEYWORDS_SEARCH_PARAM: Record<string, string> = {
  keyword: "keyword",
  query: "query",
};

type SearchUrlBuilder = (baseUrl: string, keyword: string) => string;

/**
 * Known ebook platform domain -> search URL builder mapping.
 * Key: hostname (or domain suffix) of the ebook portal.
 * Value: function that builds a search URL for a given keyword.
 */
export const DOMAIN_PATTERNS: Record<string, SearchUrlBuilder> = {
  // 교보문고 전자도서관
  "ebook.kyobobook.co.kr": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.keyword}=${encodeURIComponent(kw)}`,

  // 리브로 (예스24 기반 전자도서관 플랫폼)
  "libro.co.kr": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.keyword}=${encodeURIComponent(kw)}`,

  // 예스24 전자도서관
  "lib.yes24.com": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.query}=${encodeURIComponent(kw)}`,

  // OverDrive
  "overdrive.com": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.query}=${encodeURIComponent(kw)}`,

  // 서울도서관 전자책
  "elib.seoul.go.kr": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.keyword}=${encodeURIComponent(kw)}`,

  // 알라딘 전자도서관
  "ebook.aladin.co.kr": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.query}=${encodeURIComponent(kw)}`,

  // ECO 전자도서관 (서울시 자치구 다수 사용)
  "eco-library.seoul.kr": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.keyword}=${encodeURIComponent(kw)}`,

  // 북큐브 전자도서관
  "bookcube.com": (base, kw) =>
    `${base}/search?${EBOOK_KEYWORDS_SEARCH_PARAM.keyword}=${encodeURIComponent(kw)}`,
};

/**
 * Builds an ebook search URL from a discovered ebook portal URL and keyword.
 * Matches the ebook URL's hostname against known domain patterns.
 * Falls back to returning the raw ebook URL if no pattern matches.
 */
export function buildEbookSearchUrl(
  ebookUrl: string,
  keyword: string
): string {
  try {
    const { hostname, origin } = new URL(ebookUrl);

    // Try exact hostname match first
    const exactBuilder = DOMAIN_PATTERNS[hostname];
    if (exactBuilder) {
      return exactBuilder(origin, keyword);
    }

    // Try suffix match (e.g., "overdrive.com" matches "seoul.overdrive.com")
    for (const [domain, builder] of Object.entries(DOMAIN_PATTERNS)) {
      if (hostname.endsWith(`.${domain}`) || hostname === domain) {
        return builder(origin, keyword);
      }
    }

    // No pattern matched — return the ebook URL as-is for manual search
    return ebookUrl;
  } catch {
    return ebookUrl;
  }
}
