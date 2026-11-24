import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAccount } from "@/hooks/use-account";
import { BalanceBadge, Modal, Shell, Stat, btn2Cls, btnCls, inputCls } from "@/components/portal-ui";
import { downloadFile, naira, statusOf, toCsv, normalizeMemberNo } from "@/lib/members";
import { setMemberLogin } from "@/lib/admin.functions";
import { AdminUpdates } from "@/components/admin-updates";
import { AdminSubscribers } from "@/components/admin-subscribers";
import { AdminBirthdays } from "@/components/admin-birthdays";
import { Button } from "@/components/ui/button";
import { AdminRegistrations } from "@/components/admin-registrations";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — UDA Lagos" }, { name: "description", content: "Manage members, payments, dues and association updates." }, { property: "og:title", content: "Admin — UDA Lagos" }, { property: "og:description", content: "Association administration portal." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Admin,
});

type MB = Database["public"]["Views"]["member_balances"]["Row"];

function Admin() {
  const { data: acct, isLoading, error, refetch } = useAccount();
  const [tab, setTab] = useState<"members" | "proofs" | "dues" | "messages" | "updates" | "subscribers" | "birthdays" | "registrations">("members");
  if (isLoading) return <Shell title="Admin"><p className="text-muted-foreground">Loading…</p></Shell>;
  if (error) return <Shell title="Admin"><LoadError retry={() => void refetch()} /></Shell>;
  if (!acct?.isAdmin) return <Shell title="Admin"><p>You don't have admin access.</p></Shell>;
  return (
    <Shell title="Admin" subtitle="Members, payments and dues">
      <div className="mb-6 flex flex-wrap gap-2">
        {([["members", "Members"], ["registrations", "Registrations"], ["proofs", "Payment proofs"], ["dues", "Yearly dues"], ["messages", "Messages"], ["updates", "News & Events"], ["subscribers", "Subscribers"], ["birthdays", "Birthdays"]] as const).map(([k, l]) => (
          <Button key={k} onClick={() => setTab(k)} variant={tab === k ? "default" : "outline"}>{l}</Button>
        ))}
      </div>
      {tab === "members" && <Members />}
      {tab === "registrations" && <AdminRegistrations />}
      {tab === "proofs" && <Proofs />}
      {tab === "dues" && <Dues />}
      {tab === "messages" && <Messages />}
      {tab === "updates" && <AdminUpdates />}
      {tab === "subscribers" && <AdminSubscribers />}
      {tab === "birthdays" && <AdminBirthdays />}
    </Shell>
  );
}

function LoadError({ retry }: { retry: () => void }) {
  return <div role="alert" className="space-y-3 py-4"><p className="text-destructive">Unable to load this information. Please try again.</p><Button variant="outline" onClick={retry}>Try again</Button></div>;
}

function useMembers() {
  return useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("member_balances").select("*").order("id");
      if (error) throw error;
      return data;
    },
  });
}

function Members() {
  const { data: members = [], isPending, error, refetch } = useMembers();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "owing" | "credit" | "clear">("all");
  const [sel, setSel] = useState<MB | null>(null);
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => {
    const owing = members.filter((m) => Number(m.balance) > 0);
    return {
      total: members.length,
      owing: owing.length,
      outstanding: owing.reduce((s, m) => s + Number(m.balance), 0),
      collected: members.reduce((s, m) => s + Number(m.paid), 0),
    };
  }, [members]);

  const list = members.filter(
    (m) => (filter === "all" || statusOf(Number(m.balance)) === filter) && `${m.name}${m.id}`.toLowerCase().includes(q.toLowerCase()),
  );

  function exportCsv() {
    const rows = members.map((m) => ({
      member_no: m.id, name: m.name, email: m.email, phone: m.phone, address: m.address,
      balance_bf: m.opening, dues: m.dues, welfare_levy: m.welfare, development_levy: m.dev_levy, paid: m.paid, balance: m.balance,
    }));
    downloadFile(`uda-lagos-statements-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  }

  if (isPending) return <p className="text-muted-foreground">Loading members…</p>;
  if (error) return <LoadError retry={() => void refetch()} />;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Members" value={String(stats.total)} />
        <Stat label="Total paid" value={naira(stats.collected)} />
        <Stat label="Owing" value={`${stats.owing} members`} />
        <Stat label="Outstanding" value={naira(stats.outstanding)} accent />
      </div>
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or member number…" className={`${inputCls} flex-1 py-3`} />
        <div className="flex flex-wrap gap-2">
          {(["all", "owing", "credit", "clear"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`capitalize ${filter === f ? btnCls : btn2Cls}`}>{f}</button>
          ))}
          <button onClick={exportCsv} className={btn2Cls}>Export CSV</button>
          <button onClick={() => setAdding(true)} className={btnCls}>+ Add member</button>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{list.length} members</p>
      <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
        {list.map((m) => (
          <button key={m.id} onClick={() => setSel(m)} className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent">
            <span className="w-20 font-mono text-xs text-muted-foreground">{m.id}</span>
            <span className="flex-1 text-sm">{m.name}</span>
            {m.user_id && <span className="hidden text-xs text-muted-foreground md:inline">has login</span>}
            <BalanceBadge b={Number(m.balance)} />
          </button>
        ))}
      </div>
      {sel && <MemberModal m={sel} onClose={() => setSel(null)} />}
      {adding && <MemberModal onClose={() => setAdding(false)} />}
    </>
  );
}

function MemberModal({ m, onClose }: { m?: MB; onClose: () => void }) {
  const qc = useQueryClient();
  const isNew = !m;
  const [f, setF] = useState({
    id: m?.id ?? "", name: m?.name ?? "", email: m?.email ?? "", phone: m?.phone ?? "", address: m?.address ?? "",
    opening: String(m?.opening ?? 0), dues: String(m?.dues ?? 0), welfare: String(m?.welfare ?? 0), dev_levy: String(m?.dev_levy ?? 0),
  });
  const refresh = () => qc.invalidateQueries();

  async function save(e: FormEvent) {
    e.preventDefault();
    const row = {
      name: f.name.trim(), email: f.email.trim() || null, phone: f.phone || null, address: f.address || null,
      opening: Number(f.opening), dues: Number(f.dues), welfare: Number(f.welfare), dev_levy: Number(f.dev_levy),
    };
    const { error } = isNew
      ? await supabase.from("members").insert({ ...row, id: normalizeMemberNo(f.id) })
      : await supabase.from("members").update(row).eq("id", m?.id ?? "");
    if (error) { toast.error(error.message); return; }
    toast.success(isNew ? "Member added" : "Member updated");
    refresh();
    if (isNew) onClose();
  }

  async function remove() {
    if (!m?.id) return;
    if (!confirm(`Remove ${m.name}? Their payments will also be deleted.`)) return;
    const { error } = await supabase.from("members").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    refresh();
    onClose();
  }

  const field = (k: keyof typeof f, label: string, type = "text") => (
    <label className="text-xs text-muted-foreground">
      {label}
      <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${inputCls} mt-1 text-foreground`}
        required={k === "name" || k === "id"} disabled={k === "id" && !isNew} />
    </label>
  );

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between">
        <div>
          {m && <p className="font-mono text-xs text-muted-foreground">{m.id}</p>}
          <h2 className="font-serif text-2xl">{isNew ? "Add member" : m?.name}</h2>
        </div>
        {m && <BalanceBadge b={Number(m.balance)} />}
      </div>
      <form onSubmit={save} className="mt-4 grid grid-cols-2 gap-3">
        {isNew && field("id", "Member number")}
        <div className={isNew ? "" : "col-span-2"}>{field("name", "Full name")}</div>
        {field("email", "Email", "email")}
        {field("phone", "Phone")}
        <div className="col-span-2">{field("address", "Home address")}</div>
        {field("opening", "Balance brought forward / adjustments", "number")}
        {field("dues", "Dues", "number")}
        {field("welfare", "Welfare levy", "number")}
        {field("dev_levy", "Development levy", "number")}
        <div className="col-span-2 flex justify-between gap-2 pt-2">
          {!isNew ? <button type="button" onClick={remove} className="text-sm text-destructive underline">Remove member</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={btn2Cls}>Close</button>
            <button className={btnCls}>Save</button>
          </div>
        </div>
      </form>
      {m?.id && (
        <>
          <RecordPayment memberId={m.id} />
          <LoginSetup memberId={m.id} hasLogin={!!m.user_id} />
        </>
      )}
    </Modal>
  );
}

function RecordPayment({ memberId }: { memberId: string }) {
  const qc = useQueryClient();
  const { data: payments = [], isPending, error, refetch } = useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("member_id", memberId).order("paid_on", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({ member_id: memberId, amount: Number(amount), paid_on: date, note: note || null, recorded_by: u.user?.id ?? null });
    if (error) { toast.error(error.message); return; }
    toast.success("Payment recorded");
    setAmount(""); setNote("");
    qc.invalidateQueries();
  }
  async function del(id: string) {
    if (!confirm("Delete this payment?")) return;
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries();
  }

  return (
    <section className="mt-6 border-t border-border pt-4">
      <h3 className="font-semibold">Record payment</h3>
      <form onSubmit={add} className="mt-2 grid grid-cols-3 gap-2">
        <input required type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₦ amount" className={inputCls} />
        <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        <button className={btnCls}>Add</button>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className={`${inputCls} col-span-3`} />
      </form>
      {isPending && <p className="mt-3 text-sm text-muted-foreground">Loading payments…</p>}
      {error && <LoadError retry={() => void refetch()} />}
      {!isPending && !error && !payments.length && <p className="mt-3 text-sm text-muted-foreground">No payments recorded yet.</p>}
      <ul className="mt-3 max-h-40 divide-y divide-border overflow-y-auto text-sm">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2">
            <span className="flex-1"><span className="font-mono text-xs text-muted-foreground">{p.paid_on}</span> {p.note}</span>
            <span className="font-mono">{naira(Number(p.amount))}</span>
            <button onClick={() => del(p.id)} className="text-xs text-destructive">✕</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LoginSetup({ memberId, hasLogin }: { memberId: string; hasLogin: boolean }) {
  const qc = useQueryClient();
  const setLogin = useServerFn(setMemberLogin);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await setLogin({ data: { memberId, password: pw } });
      toast.success(r.reset ? "Password reset" : `Login created — member signs in with ${memberId}`);
      setPw("");
      qc.invalidateQueries();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-6 border-t border-border pt-4">
      <h3 className="font-semibold">Member-number login</h3>
      <p className="text-xs text-muted-foreground">
        {hasLogin ? "This member already has a login. Setting a password here resets a member-number login." : `Give this member a password; they sign in with ${memberId}.`}
      </p>
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password (8+ characters)" className={inputCls} />
        <button disabled={busy} className={btnCls}>{hasLogin ? "Reset" : "Create"}</button>
      </form>
    </section>
  );
}

function Proofs() {
  const qc = useQueryClient();
  const { data: proofs = [], isPending, error, refetch } = useQuery({
    queryKey: ["admin-proofs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_proofs").select("*, members(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function view(path: string) {
    const { data, error } = await supabase.storage.from("proofs").createSignedUrl(path, 300);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }
  async function review(id: string, approve: boolean) {
    const { error } = await supabase.rpc("review_proof", { _proof_id: id, _approve: approve });
    if (error) { toast.error(error.message); return; }
    toast.success(approve ? "Approved — payment recorded" : "Rejected");
    qc.invalidateQueries();
  }
  if (isPending) return <p className="text-muted-foreground">Loading payment proofs…</p>;
  if (error) return <LoadError retry={() => void refetch()} />;
  if (!proofs.length) return <p className="text-muted-foreground">No payment proofs submitted yet.</p>;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {proofs.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-0">
          <span className="font-mono text-xs text-muted-foreground">{p.member_id}</span>
          <span className="flex-1 text-sm">{(p.members as { name: string } | null)?.name}<span className="block text-xs text-muted-foreground">{p.paid_on} · {p.note}</span></span>
          <span className="font-mono">{naira(Number(p.amount))}</span>
          <button onClick={() => view(p.file_path)} className="text-sm underline">View</button>
          {p.status === "pending" ? (
            <>
              <button onClick={() => review(p.id, true)} className={btnCls}>Approve</button>
              <button onClick={() => review(p.id, false)} className={btn2Cls}>Reject</button>
            </>
          ) : (
            <span className={p.status === "approved" ? "text-sm text-success" : "text-sm text-destructive"}>{p.status}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function Dues() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["dues"],
    queryFn: async () => (await supabase.from("dues_settings").select("*").order("year", { ascending: false })).data ?? [],
  });
  const [f, setF] = useState({ year: String(new Date().getFullYear()), dues: "", welfare: "", dev_levy: "" });

  async function save(e: FormEvent, apply: boolean) {
    e.preventDefault();
    const row = { year: Number(f.year), dues: Number(f.dues), welfare: Number(f.welfare), dev_levy: Number(f.dev_levy) };
    const { error } = await supabase.from("dues_settings").upsert({ ...row, updated_at: new Date().toISOString() });
    if (error) { toast.error(error.message); return; }
    if (apply) {
      if (!confirm("Set every member's dues and levies to these amounts? Individual adjustments will be overwritten.")) return;
      const { error: e2 } = await supabase.from("members").update({ dues: row.dues, welfare: row.welfare, dev_levy: row.dev_levy }).neq("id", "");
      if (e2) { toast.error(e2.message); return; }
    }
    toast.success(apply ? "Saved and applied to all members" : "Saved");
    qc.invalidateQueries();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={(e) => save(e, false)} className="space-y-3 rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-xl">Set yearly dues</h2>
        {(["year", "dues", "welfare", "dev_levy"] as const).map((k) => (
          <label key={k} className="block text-xs text-muted-foreground">
            {{ year: "Year", dues: "Dues (₦)", welfare: "Welfare levy (₦)", dev_levy: "Development levy (₦)" }[k]}
            <input required type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={`${inputCls} mt-1 text-foreground`} />
          </label>
        ))}
        <div className="flex gap-2 pt-2">
          <button className={btn2Cls}>Save</button>
          <button type="button" onClick={(e) => save(e as unknown as FormEvent, true)} className={btnCls}>Save & apply to all members</button>
        </div>
      </form>
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-xl">History</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th>Year</th><th>Dues</th><th>Welfare</th><th>Dev. levy</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year} className="border-t border-border">
                <td className="py-2">{r.year}</td><td>{naira(Number(r.dues))}</td><td>{naira(Number(r.welfare))}</td><td>{naira(Number(r.dev_levy))}</td>
                <td><button onClick={() => setF({ year: String(r.year), dues: String(r.dues), welfare: String(r.welfare), dev_levy: String(r.dev_levy) })} className="text-xs underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Messages() {
  const qc = useQueryClient();
  const { data: msgs = [], isPending, error, refetch } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  async function toggle(id: string, handled: boolean) {
    const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  }
  if (isPending) return <p className="text-muted-foreground">Loading messages…</p>;
  if (error) return <LoadError retry={() => void refetch()} />;
  if (!msgs.length) return <p className="text-muted-foreground">No messages yet.</p>;
  return (
    <div className="space-y-3">
      {msgs.map((m) => (
        <div key={m.id} className={`rounded-lg border border-border bg-card p-5 ${m.handled ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{m.name} <span className="text-sm font-normal text-muted-foreground">· {m.email}{m.phone ? ` · ${m.phone}` : ""}</span></p>
            <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-NG")}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
          <button onClick={() => toggle(m.id, !m.handled)} className="mt-3 text-sm underline">{m.handled ? "Mark as new" : "Mark as handled"}</button>
        </div>
      ))}
    </div>
  );
}
