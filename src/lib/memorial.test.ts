import { describe, expect, it } from "vitest";
import { isMemorialPortrait } from "./memorial";

describe("memorial portraits", () => {
  it("recognizes a marked funeral event with a portrait", () => {
    expect(isMemorialPortrait({ kind: "event", is_memorial: true, image_url: "/portrait.jpg" })).toBe(true);
  });
  it("excludes ordinary events even when they have a photo", () => {
    expect(isMemorialPortrait({ kind: "event", is_memorial: false, image_url: "/event.jpg" })).toBe(false);
  });
  it("excludes news and meetings", () => {
    for (const kind of ["news", "meeting"]) {
      expect(isMemorialPortrait({ kind, is_memorial: true, image_url: "/portrait.jpg" })).toBe(false);
    }
  });
  it("requires a portrait", () => {
    expect(isMemorialPortrait({ kind: "event", is_memorial: true, image_url: null })).toBe(false);
  });
});