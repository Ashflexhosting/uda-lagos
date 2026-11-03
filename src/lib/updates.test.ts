// Transactional policy checks against the configured database; no rows are retained.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function sql(query: string) {
  return execFileSync("psql", ["-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1"], {
    input: query, encoding: "utf8", env: { ...process.env, PGDATABASE: process.env.SUPABASE_DB_URL },
  }).trim();
}
describe.skipIf(!process.env.SUPABASE_DB_URL)("news/events privacy", () => {
  it("visitors can read published updates but not drafts", () => {
    const output = sql(`BEGIN;
      INSERT INTO public.association_updates (title,body,published) VALUES ('privacy-test-public','test',true),('privacy-test-draft','test',false);
      SET LOCAL ROLE anon;
      SELECT title FROM public.association_updates WHERE title LIKE 'privacy-test-%' ORDER BY title;
      ROLLBACK;`);
    expect(output).toBe("privacy-test-public");
  });
  it("a signed-in member without an admin role cannot create updates", () => {
    const output = sql(`BEGIN;
      SET LOCAL ROLE authenticated;
      DO $$ BEGIN
        BEGIN
          INSERT INTO public.association_updates (title,body) VALUES ('denied-test','test');
          RAISE EXCEPTION 'Unexpected insert allowed';
        EXCEPTION WHEN insufficient_privilege THEN NULL;
        END;
      END $$;
      SELECT 'member-write-denied';
      ROLLBACK;`);
    expect(output).toBe("member-write-denied");
  });
});