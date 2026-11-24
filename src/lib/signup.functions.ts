import { createServerFn } from "@tanstack/react-start";
import { normalizePhone, phoneLoginEmail } from "./members";
import { validateRegistrationName } from "./registration";

/** Phone credentials do not prove membership; the signup trigger queues officer review. */
export const signUpWithPhone = createServerFn({ method: "POST" })
  .inputValidator((i: { phone: string; password: string; fullName: string }) => {
    const phone = normalizePhone(i.phone);
    const password = String(i.password ?? "");
    const fullName = validateRegistrationName(i.fullName);
    if (!/^\d{10,15}$/.test(phone)) throw new Error("Enter a valid phone number");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    return { phone, password, fullName };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: phoneLoginEmail(data.phone),
      password: data.password,
      email_confirm: true,
      user_metadata: { phone: data.phone, full_name: data.fullName },
    });
    if (error) {
      if (/already/i.test(error.message)) throw new Error("An account with this phone number already exists. Please sign in.");
      throw new Error(error.message);
    }
    return { ok: true };
  });
