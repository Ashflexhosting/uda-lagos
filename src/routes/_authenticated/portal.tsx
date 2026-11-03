import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/use-account";
import { BalanceBadge, Row, Shell, Stat, btnCls, inputCls } from "@/components/portal-ui";
import { BankAccounts } from "@/components/bank-accounts";
import { naira } from "@/lib/members";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "My account — UDA Lagos" }, { name: "description", content: "Your dues, payments and balance." }, { property: "og:title", content: "My account — UDA Lagos" }, { property: "og:description", content: "Your membership account and payment history." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Portal,
});

function Portal() {
  const { data: acct, isLoading } = useAccount();
  if (isLoading) return <Shell title="My account"><p className="text-muted-foreground">Loading…</p></Shell>;
  const m = acct?.member;
  if (!m) {
    return (
      <Shell title="My account">
        <div className="max-w-xl rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-xl">Your login isn't linked to a member record yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {acct?.user.email}. Ask an officer to add this email to your member record, or to give you a member-number login.
          </p>
        </div>
      </Shell>
    );
  }
  return (
    <Shell title={m.name!} subtitle={`Member no. ${m.id}`}>
      <MemberAccount memberId={m.id!} />
    </Shell>
  );
}

function MemberAccount({ memberId }: { memberId: string }) {
  const { data } = useQuery({
    queryKey: ["member", memberId],
    queryFn: async () => {
      const [m, p, pr] = await Promise.all([
        supabase.from("member_balances").select("*").eq("id", memberId).single(),
        supabase.from("payments").select("*").eq("member_id", memberId).order("paid_on", { ascending: false }),
        supabase.from("payment_proofs").select("*").eq("member_id", memberId).order("created_at", { ascending: false }),
      ]);
      if (m.error) throw m.error;
      return { m: m.data, payments: p.data ?? [], proofs: pr.data ?? [] };
    },
  });
  if (!data) return <p className="text-muted-foreground">Loading…</p>;
  const { m, payments, proofs } = data;
  const bal = Number(m.balance);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Stat label="Balance" value={bal > 0 ? `${naira(bal)} owed` : bal < 0 ? `${naira(bal)} credit` : "Cleared"} accent={bal > 0} />
        <Stat label="Paid" value={naira(Number(m.paid))} />
        <Stat label="Charges 2026" value={naira(Number(m.dues) + Number(m.welfare) + Number(m.dev_levy))} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl">Statement</h2>
            <button onClick={() => window.print()} className="text-sm underline print:hidden">Download / print</button>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Balance brought forward" v={Number(m.opening)} />
            <Row k="Dues 2026" v={Number(m.dues)} />
            <Row k="Welfare levy 2026" v={Number(m.welfare)} />
            <Row k="Development levy 2026" v={Number(m.dev_levy)} />
            <Row k="Payments" v={-Number(m.paid)} />
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Balance</dt><dd><BalanceBadge b={bal} /></dd></div>
          </dl>
          <h3 className="mt-6 text-sm font-semibold">Payment history</h3>
          <ul className="mt-2 divide-y divide-border text-sm">
            {payments.length === 0 && <li className="py-2 text-muted-foreground">No payments yet.</li>}
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-4 py-2">
                <span><span className="font-mono text-xs text-muted-foreground">{p.paid_on}</span> {p.note}</span>
                <span className="font-mono">{naira(Number(p.amount))}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-8 print:hidden">
          <ProofForm memberId={memberId} proofs={proofs} />
          <ContactForm m={m} />
        </div>
      </div>
    </div>
  );
}

type ProofRow = { id: string; amount: number; paid_on: string; status: string; note: string | null };

function ProofForm({ memberId, proofs }: { memberId: string; proofs: ProofRow[] }) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDate(new Date().toISOString().slice(0, 10)), []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const path = `${memberId}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("proofs").upload(path, file);
    if (up.error) { setBusy(false); { toast.error(up.error.message); return; } }
    const { error } = await supabase.from("payment_proofs").insert({ member_id: memberId, amount: Number(amount), paid_on: date, note: note || null, file_path: path });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Sent — an officer will confirm it.");
    setAmount(""); setNote(""); setFile(null);
    (e.target as HTMLFormElement).reset();
    qc.invalidateQueries({ queryKey: ["member", memberId] });
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-serif text-xl">Upload proof of payment</h2>
      <BankAccounts className="mt-3 rounded-md border border-border bg-background p-4" />
      <form onSubmit={submit} className="mt-4 grid grid-cols-2 gap-3">
        <input required type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₦)" className={inputCls} />
        <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (e.g. bank, reference)" className={`${inputCls} col-span-2`} />
        <input required type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="col-span-2 text-sm" />
        <button disabled={busy} className={`${btnCls} col-span-2`}>{busy ? "Uploading…" : "Submit"}</button>
      </form>
      {proofs.length > 0 && (
        <ul className="mt-4 divide-y divide-border text-sm">
          {proofs.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <span>{p.paid_on} · {naira(Number(p.amount))}</span>
              <span className={p.status === "approved" ? "text-success" : p.status === "rejected" ? "text-destructive" : "text-muted-foreground"}>{p.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ContactRow = { id: string | null; email: string | null; phone: string | null; address: string | null; photo_path: string | null };

function ContactForm({ m }: { m: ContactRow }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ email: m.email ?? "", phone: m.phone ?? "", address: m.address ?? "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!m.photo_path) return;
    supabase.storage.from("photos").createSignedUrl(m.photo_path, 3600).then(({ data }) => setPhotoUrl(data?.signedUrl ?? null));
  }, [m.photo_path]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    let photo_path = m.photo_path;
    if (photo) {
      photo_path = `${m.id}/photo-${Date.now()}`;
      const up = await supabase.storage.from("photos").upload(photo_path, photo, { upsert: true });
      if (up.error) { setBusy(false); { toast.error(up.error.message); return; } }
    }
    const { error } = await supabase.rpc("update_my_contact", { _email: f.email, _phone: f.phone, _address: f.address, _photo_path: photo_path ?? "" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Details saved");
    qc.invalidateQueries();
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-serif text-xl">My details</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="flex items-center gap-4">
          {photoUrl ? <img src={photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-muted" />}
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="text-sm" />
        </div>
        <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className={inputCls} />
        <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone number" className={inputCls} />
        <textarea value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Home address" rows={2} className={inputCls} />
        <button disabled={busy} className={btnCls}>{busy ? "Saving…" : "Save details"}</button>
      </form>
    </section>
  );
}
