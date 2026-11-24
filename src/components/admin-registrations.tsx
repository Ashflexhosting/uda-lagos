import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/portal-ui";
import { rankNameMatches } from "@/lib/registration";

type Request = Database["public"]["Tables"]["member_registrations"]["Row"];
type Member = { id: string; name: string; user_id: string | null };

export function AdminRegistrations() {
  const [status, setStatus] = useState("pending");
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: async () => {
      const [requests, members] = await Promise.all([
        supabase.from("member_registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("members").select("id,name,user_id").order("name"),
      ]);
      if (requests.error) throw requests.error;
      if (members.error) throw members.error;
      return { requests: requests.data, members: members.data };
    },
    refetchInterval: 15000,
  });
  if (isPending) return <p className="text-muted-foreground">Loading registrations…</p>;
  if (error || !data) return <div role="alert" className="space-y-3"><p className="text-destructive">Could not load registrations.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div>;
  const list = data.requests.filter((request) => request.status === status);
  return (
    <section className="space-y-5">
      <div><h2 className="flex items-center gap-2 font-serif text-2xl"><UserCheck className="h-6 w-6 text-primary" />Membership verification</h2><p className="mt-2 text-sm text-muted-foreground">Confirm each person’s identity before approving a name match. Existing linked accounts cannot be replaced.</p></div>
      <div className="flex flex-wrap gap-2" aria-label="Registration status">
        {["pending", "approved", "rejected"].map((item) => <Button key={item} variant={status === item ? "default" : "outline"} className="capitalize" onClick={() => setStatus(item)}>{item} ({data.requests.filter((request) => request.status === item).length})</Button>)}
      </div>
      {list.length === 0 && <p className="py-6 text-sm text-muted-foreground">No {status} registrations.</p>}
      <div className="grid gap-4 lg:grid-cols-2">{list.map((request) => <RegistrationReview key={request.id} request={request} members={data.members} />)}</div>
    </section>
  );
}

function RegistrationReview({ request, members }: { request: Request; members: Member[] }) {
  const qc = useQueryClient();
  const [memberId, setMemberId] = useState("");
  const [search, setSearch] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const matches = rankNameMatches(request.full_name, members);
  const matchIds = new Set(matches.map((member) => member.id));
  const others = members.filter((member) => !matchIds.has(member.id) && `${member.name} ${member.id}`.toLowerCase().includes(search.toLowerCase()));
  const selected = members.find((member) => member.id === memberId);

  async function review(approve: boolean) {
    if (approve && (!confirmed || !selected || selected.user_id)) return;
    if (!window.confirm(approve ? `Link ${request.full_name} to ${selected?.name} (${memberId})?` : `Reject the registration for ${request.full_name}?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("review_member_registration", { _request_id: request.id, _member_id: memberId, _approve: approve });
      if (error) throw error;
      toast.success(approve ? "Membership approved and linked." : "Registration rejected.");
      await Promise.all([qc.invalidateQueries({ queryKey: ["admin-registrations"] }), qc.invalidateQueries({ queryKey: ["admin-members"] }), qc.invalidateQueries({ queryKey: ["account"] })]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not review this registration."); }
    finally { setBusy(false); }
  }

  const option = (member: Member) => <option key={member.id} value={member.id} disabled={!!member.user_id}>{member.id} — {member.name}{member.user_id ? " (already linked)" : ""}</option>;
  return (
    <article className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div><h3 className="break-words font-semibold">{request.full_name}</h3><p className="mt-1 break-all text-sm text-muted-foreground">{request.contact || "No contact supplied"}</p><p className="mt-1 text-xs text-muted-foreground">Submitted {new Date(request.created_at).toLocaleDateString("en-NG")}</p></div>
      {request.status !== "pending" ? <p className="text-sm font-medium">{request.status === "approved" ? `Linked to ${request.member_id}` : "Not approved"}</p> : (
        <>
          <p className="text-sm text-muted-foreground">{matches.length ? `${matches.length} possible name ${matches.length === 1 ? "match" : "matches"}` : "No suggested name match. Check with the member or add their record in Members first."}</p>
          <label className="block space-y-2 text-sm"><span>Search register</span><input className={inputCls} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or membership number" /></label>
          <label className="block space-y-2 text-sm"><span>Existing member</span><select className={`${inputCls} w-full`} value={memberId} onChange={(event) => { setMemberId(event.target.value); setConfirmed(false); }}><option value="">Choose the correct member</option>{matches.length > 0 && <optgroup label="Suggested name matches">{matches.map(option)}</optgroup>}<optgroup label="Other members">{others.map(option)}</optgroup></select></label>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-primary" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I have confirmed this person’s identity and membership.</span></label>
          <div className="flex flex-wrap gap-2"><Button disabled={busy || !memberId || !confirmed || !!selected?.user_id} onClick={() => void review(true)}><Check className="h-4 w-4" />Approve match</Button><Button variant="outline" disabled={busy} onClick={() => void review(false)}><X className="h-4 w-4" />Reject</Button></div>
        </>
      )}
    </article>
  );
}