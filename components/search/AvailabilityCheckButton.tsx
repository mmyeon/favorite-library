"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Library } from "@/types";
import type { LoanStatus } from "@/lib/services/book-availability";

interface AvailabilityCheckButtonProps {
  isbn13: string;
  owningLibCodes: string[];
  libraries: Library[];
}

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; statusByLibCode: Record<string, LoanStatus> };

type ApiResponse = {
  success: boolean;
  data?: { statusByLibCode: Record<string, LoanStatus> };
  error?: string;
};

const STATUS_LABEL: Record<LoanStatus, string> = {
  available: "대출 가능",
  "on-loan": "대출 중",
  "not-owned": "미소장",
  error: "조회 실패",
};

const STATUS_CLASS: Record<LoanStatus, string> = {
  available: "text-green-600 font-medium",
  "on-loan": "text-amber-600",
  "not-owned": "text-muted-foreground",
  error: "text-muted-foreground",
};

export function AvailabilityCheckButton({
  isbn13,
  owningLibCodes,
  libraries,
}: AvailabilityCheckButtonProps) {
  const [state, setState] = useState<FetchState>({ kind: "idle" });

  const hasOwningLibs = owningLibCodes.length > 0;

  if (!hasOwningLibs) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">소장 도서관 없음</p>
    );
  }

  async function handleCheck() {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/book-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isbn13, libCodes: owningLibCodes }),
      });

      const json = (await response.json()) as ApiResponse;

      if (!response.ok || !json.success || !json.data) {
        setState({
          kind: "error",
          message: json.error ?? "대출 가능 여부 조회에 실패했습니다.",
        });
        return;
      }

      setState({ kind: "success", statusByLibCode: json.data.statusByLibCode });
    } catch {
      setState({
        kind: "error",
        message: "네트워크 오류로 조회에 실패했습니다.",
      });
    }
  }

  const owningLibraries = libraries.filter((lib) =>
    owningLibCodes.includes(lib.libCode),
  );

  return (
    <div className="mt-3 flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCheck}
        disabled={state.kind === "loading"}
        className="self-start"
      >
        {state.kind === "loading" ? "조회 중..." : "대출 가능 확인"}
      </Button>

      {state.kind === "error" && (
        <p className="text-xs text-red-600" role="alert">
          {state.message}
        </p>
      )}

      {state.kind === "success" && (
        <ul className="flex flex-col gap-1 text-sm">
          {owningLibraries.map((lib) => {
            const status = state.statusByLibCode[lib.libCode] ?? "error";
            return (
              <li key={lib.libCode} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{lib.libName}</span>
                <span className={STATUS_CLASS[status]}>
                  {STATUS_LABEL[status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
