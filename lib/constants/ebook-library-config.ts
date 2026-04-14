export type EbookLibraryConfig = {
  libName: string;
  searchUrl: (keyword: string) => string;
  emptyTexts: string[];
  availableTexts: string[];
};

// libCode → 전자도서관 스크래핑 설정
// libCode: 정보나루 API의 도서관 코드
//
// 각 도서관의 전자도서관 URL은 수동 검증이 필요하므로 현재 비어 있음.
// 추후 자동 발견 기능(이슈 #4)에서 채워질 예정.
export const EBOOK_LIBRARY_CONFIGS: Record<string, EbookLibraryConfig> = {};
