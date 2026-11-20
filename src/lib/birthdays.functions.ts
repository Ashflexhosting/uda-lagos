import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { lagosDate } from "@/lib/meetings";
import { birthdaysThisMonth } from "@/lib/birthdays";

export const listMonthBirthdays = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Birthdays are temporarily unavailable.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("birthday_announcements").select("id,name,birthday,message,image_url").eq("published", true);
  if (error) throw new Error("Birthdays are temporarily unavailable.");
  const today = lagosDate(new Date());
  return { today, birthdays: birthdaysThisMonth(data, today) };
});
