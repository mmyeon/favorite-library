import "server-only";
import {
  fetchBookLoanStatus,
  type Result,
} from "@/lib/api/data4library";

export type LoanStatus = "available" | "on-loan" | "not-owned" | "error";

export type CheckLoanStatusInput = {
  isbn13: string;
  libCodes: string[];
};

export type CheckLoanStatusData = {
  statusByLibCode: Record<string, LoanStatus>;
};

function toLoanStatus(hasBook: "Y" | "N", loanAvailable: "Y" | "N"): LoanStatus {
  if (hasBook === "N") return "not-owned";
  return loanAvailable === "Y" ? "available" : "on-loan";
}

export async function checkLoanStatus(
  input: CheckLoanStatusInput,
): Promise<Result<CheckLoanStatusData>> {
  const { isbn13, libCodes } = input;

  if (!isbn13) {
    return { success: false, error: "isbn13 is required" };
  }

  if (libCodes.length === 0) {
    return { success: true, data: { statusByLibCode: {} } };
  }

  const settled = await Promise.allSettled(
    libCodes.map((libCode) => fetchBookLoanStatus(isbn13, libCode)),
  );

  const statusByLibCode: Record<string, LoanStatus> = {};
  libCodes.forEach((libCode, index) => {
    const result = settled[index];
    if (result.status !== "fulfilled") {
      statusByLibCode[libCode] = "error";
      return;
    }
    const value = result.value;
    if (!value.success) {
      statusByLibCode[libCode] = "error";
      return;
    }
    statusByLibCode[libCode] = toLoanStatus(
      value.data.hasBook,
      value.data.loanAvailable,
    );
  });

  return { success: true, data: { statusByLibCode } };
}
