import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readOwnStatement } from "./account-statement.server";
import { accountQuestionSchema } from "./account-question";

function fixture(owner = "signed-in-member") {
  const requests: { url: URL; method: string }[] = [];
  const db = createClient<Database>("https://test.invalid", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: vi.fn(async (input, init) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      requests.push({ url, method: init?.method ?? "GET" });
      const data = url.pathname.endsWith("member_balances")
        ? { id: "UDAL001", user_id: owner, opening: 6500, dues: 10000, welfare: 15000, dev_levy: 5000, paid: 2000, balance: 34500 }
        : url.pathname.endsWith("payment_proofs")
          ? [{ amount: 3000, paid_on: "2026-11-28", status: "pending" }]
          : [{ amount: 2000, paid_on: "2026-11-27" }];
      return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
    }) },
  });
  return { db, requests };
}

describe("private account explanations", () => {
  it("reads only the signed-in member and their payments, without write requests", async () => {
    const { db, requests } = fixture();
    const statement = await readOwnStatement(db, "signed-in-member");
    expect(requests[0]?.url.searchParams.get("user_id")).toBe("eq.signed-in-member");
    for (const request of requests.slice(1)) {
      expect(request.url.searchParams.get("member_id")).toBe("eq.UDAL001");
      expect(request.url.searchParams.get("limit")).toBe("100");
    }
    expect(requests.map(request => request.method)).toEqual(["GET", "GET", "GET"]);
    expect(statement).not.toHaveProperty("user_id");
    expect(statement).not.toHaveProperty("id");
  });
  it("rejects an account belonging to anyone else before reading payment details", async () => {
    const { db, requests } = fixture("someone-else");
    await expect(readOwnStatement(db, "signed-in-member")).rejects.toThrow("must be approved");
    expect(requests).toHaveLength(1);
  });
  it("preserves the recorded balance and does not count pending proof as payment", async () => {
    const { db } = fixture();
    const statement = await readOwnStatement(db, "signed-in-member");
    expect(statement.balance).toBe(34500);
    expect(statement.totalRecordedPayments).toBe(2000);
    expect(statement.recentProofs[0]?.status).toBe("pending");
  });
  it("does not accept a member number or fabricated statement from the browser", () => {
    expect(accountQuestionSchema.safeParse({ question: "Explain my balance", memberId: "UDAL002" }).success).toBe(false);
    expect(accountQuestionSchema.safeParse({ question: "Explain my balance", balance: 0 }).success).toBe(false);
    expect(accountQuestionSchema.parse({ question: " Explain my balance " })).toEqual({ question: "Explain my balance" });
  });
});