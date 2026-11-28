import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Resolve ownership from the verified session, including for administrators. */
export async function readOwnStatement(db: SupabaseClient<Database>, userId: string) {
  const { data: member, error } = await db.from("member_balances")
    .select("id,user_id,opening,dues,welfare,dev_levy,paid,balance")
    .eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Unable to read your statement.");
  if (!member?.id || member.user_id !== userId) throw new Error("Your membership must be approved before you can ask about your statement.");
  const [payments, proofs] = await Promise.all([
    db.from("payments").select("amount,paid_on").eq("member_id", member.id)
      .order("paid_on", { ascending: false }).order("id", { ascending: false }).limit(100),
    db.from("payment_proofs").select("amount,paid_on,status").eq("member_id", member.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100),
  ]);
  if (payments.error || proofs.error) throw new Error("Unable to read your payment history.");
  const amounts = [member.opening, member.dues, member.welfare, member.dev_levy, member.paid, member.balance];
  if (amounts.some(value => value === null || !Number.isFinite(Number(value)))) throw new Error("Your statement is incomplete. Please contact an officer.");
  return {
    currency: "NGN",
    chargeYear: 2026,
    broughtForward: Number(member.opening),
    dues: Number(member.dues),
    welfareLevy: Number(member.welfare),
    developmentLevy: Number(member.dev_levy),
    totalRecordedPayments: Number(member.paid),
    balance: Number(member.balance),
    recentRecordedPayments: payments.data ?? [],
    recentProofs: proofs.data ?? [],
    historyLimit: 100,
  };
}