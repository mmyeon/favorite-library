export type Library = {
  libCode: string;
  libName: string;
  address: string;
  tel: string;
  homepage: string;
  closed: string;
  operatingTime: string;
};

export type Book = {
  title: string;
  author: string;
  publisher: string;
  publicationYear: string;
  isbn13: string;
  bookImageURL: string;
  description: string;
};

export type PhysicalAvailability = {
  libCode: string;
  libName: string;
  hasBook: "Y" | "N";
  loanAvailable: "Y" | "N";
};

export type EbookAvailability = {
  libCode: string;
  libName: string;
  ebookAvailable: "Y" | "N";
  ebookUrl?: string;
};

export type LibraryResult = {
  library: Library;
  physical: PhysicalAvailability | null;
  ebook: EbookAvailability | null;
};
