import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const migration = readFileSync("drizzle/migrations/0004_create_association_updates.sql", "utf8");
const meetingMigration = readFileSync("drizzle/migrations/0006_allow_meeting_category.sql", "utf8");
const imageMigration = readFileSync("drizzle/migrations/0007_add_update_image.sql", "utf8");
describe("news/events privacy policies", () => {
  it("visitors can read published updates but not drafts", () => {
    expect(migration).toMatch(/FOR SELECT TO anon, authenticated USING \(published = true\)/);
    expect(migration).toMatch(/ENABLE ROW LEVEL SECURITY/);
  });
  it("editing and creating updates both require an admin role", () => {
    expect(migration).toMatch(/FOR ALL TO authenticated USING \(public.has_role\(auth.uid\(\), 'admin'::public.app_role\)\) WITH CHECK \(public.has_role\(auth.uid\(\), 'admin'::public.app_role\)\)/);
  });
});
describe("update categories", () => {
  it("allows news, event and meeting and nothing else", () => {
    expect(meetingMigration).toMatch(/CHECK \(kind IN \('news', 'event', 'meeting'\)\)/);
    expect(meetingMigration).toMatch(/DROP CONSTRAINT association_updates_kind_check/);
  });
  it("gives every update an optional logo image", () => {
    expect(imageMigration).toMatch(/ALTER TABLE public\.association_updates ADD COLUMN IF NOT EXISTS image_url text/);
  });
});