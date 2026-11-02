import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import data from "@/data/members.json";

type Member = (typeof data)[number];
const members = data as Member[];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UDA Lagos — Member Financial Status" },
      { name: "description", content: "Search UDA Lagos members and view dues, levies, payments and balances as at October 2026." },
      { property: "og:title", content: "UDA Lagos — Member Financial Status" },
      { property: "og:description", content: "Member dues, levies, payments and balances as at October 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const naira = (v: number) => "₦" + Math.abs(v).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const status = (b: number) => (b > 0 ? "owing" : b < 0 ? "credit" : "clear");

function Index() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "owing" | "credit" | "clear">("all");
  const [sel, setSel] = useState<Member | null>(null);

  const stats = useMemo(() => {
    const owing = members.filter((m) => m.balance > 0);
    return {
      total: members.length,
      owing: owing.length,
      outstanding: owing.reduce((s, m) => s + m.balance, 0),
      collected: members.reduce((s, m) => s + m.paid, 0),
      clear: members.filter((m) => m.balance <= 0).length,
    };
  }, []);

  const list = members.filter(
    (m) =>
      (filter === "all" || status(m.balance) === filter) &&
      (m.name + m.id).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">Uzuakoli Development Association · Lagos Branch</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Member Financial Status</h1>
          <p className="mt-2 opacity-80">Balances as at 23 October 2026</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Members" value={stats.total.toString()} />
          <Stat label="Paid 2026" value={naira(stats.collected)} />
          <Stat label="Owing" value={`${stats.owing} members`} />
          <Stat label="Outstanding" value={naira(stats.outstanding)} accent />
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or member number…"
            className="flex-1 rounded-md border border-input bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            {(["all", "owing", "credit", "clear"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-2 text-sm capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{list.length} members</p>
        <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card">
          {list.map((m) => (
            <button
              key={m.id}
              onClick={() => setSel(m)}
              className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent"
            >
              <span className="w-20 font-mono text-xs text-muted-foreground">{m.id}</span>
              <span className="flex-1 text-sm">{m.name}</span>
              <Badge b={m.balance} />
            </button>
          ))}
        </div>
      </main>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setSel(null)}>
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-xs text-muted-foreground">{sel.id}</p>
            <h2 className="mt-1 font-serif text-2xl">{sel.name}</h2>
            <dl className="mt-6 space-y-2 text-sm">
              <Row k="Balance b/f (31 Dec 2025)" v={sel.opening} />
              <Row k="Dues Jan–Oct 2026" v={sel.dues} />
              <Row k="Welfare levy 2026" v={sel.welfare} />
              <Row k="Development levy 2026" v={sel.devLevy} />
              <Row k="Payments in 2026" v={-sel.paid} />
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Balance</dt>
                <dd><Badge b={sel.balance} /></dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">Positive = amount owed; credit = paid in advance.</p>
            <button onClick={() => setSel(null)} className="mt-6 w-full rounded-md bg-primary py-2 text-primary-foreground">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono">{v < 0 ? "−" : ""}{naira(v)}</dd>
    </div>
  );
}

function Badge({ b }: { b: number }) {
  const s = status(b);
  const cls = s === "owing" ? "bg-destructive/10 text-destructive" : s === "credit" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-3 py-1 font-mono text-xs ${cls}`}>
      {s === "clear" ? "Cleared" : `${naira(b)} ${s === "credit" ? "credit" : "owed"}`}
    </span>
  );
}
