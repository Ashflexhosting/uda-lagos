import { describe, expect, it } from "vitest";
import { BANK_ACCOUNTS, computeBalance, memberLoginEmail, statusOf } from "./members";

describe("member rules", () => {
  it("balance = brought forward + dues + welfare + development levy − payments", () => {
    expect(computeBalance({ opening: 6500, dues: 10000, welfare: 15000, dev_levy: 5000 }, 0)).toBe(36500);
    expect(computeBalance({ opening: 0, dues: 10000, welfare: 15000, dev_levy: 5000 }, 32000)).toBe(-2000);
  });
  it("positive balance is owed, negative is credit", () => {
    expect(statusOf(100)).toBe("owing");
    expect(statusOf(-100)).toBe("credit");
    expect(statusOf(0)).toBe("clear");
  });
  it("member number login maps to the same account regardless of case/spaces", () => {
    expect(memberLoginEmail(" udal004 ")).toBe(memberLoginEmail("UDAL004"));
  });
  it("association bank accounts are the ones the officers gave", () => {
    expect(BANK_ACCOUNTS).toEqual([
      { label: "Operations Account", bank: "First Bank", number: "3003829209", name: "Uzuakoli Development Association, Lagos Branch" },
      { label: "Project Account", bank: "Access Bank", number: "0015636429", name: "Uzuakoli Development Association" },
    ]);
  });
});
