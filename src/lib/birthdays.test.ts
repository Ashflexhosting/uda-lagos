import { describe, expect, it } from "vitest";
import { birthdaysThisMonth } from "./birthdays";
describe("birthdaysThisMonth", () => {
  it("shows only this month's birthdays, any year, ordered by day", () => {
    const list = [{ birthday: "1980-11-25" }, { birthday: "1975-12-02" }, { birthday: "1990-11-03" }];
    expect(birthdaysThisMonth(list, "2026-11-20").map((b) => b.birthday)).toEqual(["1990-11-03", "1980-11-25"]);
  });
});
