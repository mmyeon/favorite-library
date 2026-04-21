import { fetchBookAvailability } from "@/lib/api/data4library";

interface PhysicalAvailabilityCellProps {
  isbn13: string;
  libCode: string;
}

export async function PhysicalAvailabilityCell({
  isbn13,
  libCode,
}: PhysicalAvailabilityCellProps) {
  const result = await fetchBookAvailability(isbn13, libCode);

  if (result === null) {
    return <span className="text-sm text-muted-foreground">조회 실패</span>;
  }

  if (result.hasBook === "N") {
    return <span className="text-sm text-muted-foreground">미소장</span>;
  }

  if (result.loanAvailable === "Y") {
    return <span className="text-sm font-medium text-green-600">소장 (대출가능)</span>;
  }

  return <span className="text-sm font-medium text-yellow-600">소장 (대출중)</span>;
}
