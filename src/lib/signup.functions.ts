import { createServerFn } from "@tanstack/react-start";
import { normalizePhone, phoneLoginEmail } from "./members";

async function findExistingMember(email: string | null, phone: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("members").select("email, phone");
  if (error) throw new Error("Could not check membership right now. Please try again.");
  return (data ?? []).some(
    (m) =>
      (email && m.email && m.email.trim().toLowerCase() === email) ||
      (phone && m.phone && normalizePhone(m.phone) === phone),
  );
}

const ALREADY = "You're already on the association's register. Please sign in with your membership number instead — ask an officer if you don't have a password yet.";

/** Checks an email before a new-member email sign-up. */
export const checkNewEmail = createServerFn({ method: "POST" })
  .inputValidator((i: { email: string }) => {
    const email = String(i.email ?? "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email");
    return { email };
  })
  .handler(async ({ data }) => {
    if (await findExistingMember(data.email, null)) throw new Error(ALREADY);
    return { ok: true };
  });

/** Creates a phone-number account for a new (not yet registered) member. */
export const signUpWithPhone = createServerFn({ method: "POST" })
  .inputValidator((i: { phone: string; password: string }) => {
    const phone = normalizePhone(i.phone);
    const password = String(i.password ?? "");
    if (!/^\d{10,15}$/.test(phone)) throw new Error("Enter a valid phone number");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    return { phone, password };
  })
  .handler(async ({ data }) => {
    if (await findExistingMember(null, data.phone)) throw new Error(ALREADY);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: phoneLoginEmail(data.phone),
      password: data.password,
      email_confirm: true,
      user_metadata: { phone: data.phone },
    });
    if (error) {
      if (/already/i.test(error.message)) throw new Error("An account with this phone number already exists. Please sign in.");
      throw new Error(error.message);
    }
    return { ok: true };
  });
