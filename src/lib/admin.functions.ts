import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { memberLoginEmail, normalizeMemberNo } from "./members";

/** Admin creates (or resets) a member-number login for a member. */
export const setMemberLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { memberId: string; password: string }) => {
    const memberId = normalizeMemberNo(String(input.memberId ?? ""));
    const password = String(input.password ?? "");
    if (!/^[A-Z0-9]{3,20}$/.test(memberId)) throw new Error("Invalid member number");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    return { memberId, password };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: member, error: mErr } = await supabaseAdmin.from("members").select("id, user_id").eq("id", data.memberId).maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!member) throw new Error("Member not found");

    const email = memberLoginEmail(data.memberId);
    if (member.user_id) {
      const { data: existing } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
      if (existing?.user?.email === email) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(member.user_id, { password: data.password });
        if (error) throw new Error(error.message);
        return { ok: true, reset: true };
      }
    }
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const { error: linkErr } = await supabaseAdmin.from("members").update({ user_id: created.user.id }).eq("id", data.memberId);
    if (linkErr) throw new Error(linkErr.message);
    return { ok: true, reset: false };
  });
