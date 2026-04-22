import type { PhysicalOwnership } from "@/lib/services/book-existence";
import { isOwnedBy } from "@/lib/services/book-existence";

interface PhysicalOwnershipBadgeProps {
  ownership: PhysicalOwnership | null;
  libCode: string;
}

export function PhysicalOwnershipBadge({
  ownership,
  libCode,
}: PhysicalOwnershipBadgeProps) {
  if (ownership === null) {
    return <span className="text-sm text-muted-foreground">조회 실패</span>;
  }

  if (!isOwnedBy(ownership, libCode)) {
    return <span className="text-sm text-muted-foreground">미소장</span>;
  }

  return <span className="text-sm font-medium text-green-600">소장</span>;
}
