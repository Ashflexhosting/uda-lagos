import { describe, expect, it } from "vitest";
import { nameTokens, rankNameMatches, validateRegistrationName } from "./registration";

describe("officer signup matching", () => {
  const members = [
    { id: "UDAL004", name: "ELDER CHIKEZIE ANDY ONYEABOR" },
    { id: "UDAL003", name: "CHIEF ENGR.OKECHUKWU NWOKORO" },
    { id: "UDAL005", name: "CHILASA E. OGBONNAYA (Member in Diaspora)" },
  ];
  it("retrieves the existing membership number for matching full names regardless of name order", () => {
    expect(rankNameMatches("Onyeabor Chikezie Andy", members).map((m) => m.id)).toEqual(["UDAL004"]);
  });
  it("ignores titles, punctuation and register annotations", () => {
    expect(rankNameMatches("Okechukwu Nwokoro", members).map((m) => m.id)).toEqual(["UDAL003"]);
    expect(nameTokens(members[2]?.name ?? "")).toEqual(["CHILASA", "E", "OGBONNAYA"]);
  });
  it("does not suggest a member from a single shared name or an unknown name", () => {
    expect(rankNameMatches("Andy Someone", members)).toEqual([]);
    expect(rankNameMatches("Unknown Person", members)).toEqual([]);
  });
  it("keeps ambiguous matches for officer review rather than selecting one automatically", () => {
    expect(rankNameMatches("Chikezie Andy Onyeabor", [...members, { id: "UDAL010", name: "CHIKEZIE ANDY ONYEABOR" }]).map((m) => m.id)).toEqual(["UDAL004", "UDAL010"]);
  });
  it("requires a full name before signup", () => {
    expect(() => validateRegistrationName(" ")).toThrow();
    expect(validateRegistrationName("  Chikezie   Andy Onyeabor ")).toBe("Chikezie Andy Onyeabor");
  });
});