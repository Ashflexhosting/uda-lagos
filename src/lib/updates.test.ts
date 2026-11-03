import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const migration = readFileSync("drizzle/migrations/0004_create_association_updates.sql", "utf8");
describe("news/events privacy policies", () => {
  it("visitors can read published updates but not drafts", () => {
    expect(migration).toMatch(/FOR SELECT TO anon, authenticated USING \(published = true\)/);
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/);
  });
  it("editing and creating updates both require an admin role", () => {
    expect(migration).toMatch(/FOR ALL TO authenticated USING \(public.has_role\(auth.uid\(\), 'admin'::public.app_role\)\) WITH CHECK \(public.has_role\(auth.uid\(\), 'admin'::public.app_role\)\)/);
  });
});