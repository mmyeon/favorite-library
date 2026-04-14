export function parseLibCodes(searchParams: URLSearchParams): string[] {
  const libs = searchParams.get("libs");
  if (!libs) return [];
  return libs
    .split(",")
    .map((code) => code.trim())
    .filter((code) => code.length > 0);
}

export function serializeLibCodes(libCodes: string[]): string {
  return libCodes.join(",");
}
