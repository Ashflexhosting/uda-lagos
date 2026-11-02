import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ASSOCIATION, naira, statusOf } from "@/lib/members";
import { useAccount, useSignOut } from "@/hooks/use-account";

export function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { data: acct } = useAccount();
  const signOut = useSignOut();
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground print:bg-background print:text-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] opacity-70">{ASSOCIATION}</p>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-1 opacity-80">{subtitle}</p>}
          </div>
          <nav className="flex items-center gap-2 text-sm print:hidden">
            <Link to="/portal" className="rounded-md px-3 py-2 hover:bg-primary-foreground/10" activeProps={{ className: "bg-primary-foreground/15" }}>My account</Link>
            {acct?.isAdmin && (
              <Link to="/admin" className="rounded-md px-3 py-2 hover:bg-primary-foreground/10" activeProps={{ className: "bg-primary-foreground/15" }}>Admin</Link>
            )}
            <button onClick={signOut} className="rounded-md border border-primary-foreground/30 px-3 py-2">Sign out</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-serif text-2xl ${accent ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

export function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-mono">{v < 0 ? "−" : ""}{naira(v)}</dd>
    </div>
  );
}

export function BalanceBadge({ b }: { b: number }) {
  const s = statusOf(b);
  const cls = s === "owing" ? "bg-destructive/10 text-destructive" : s === "credit" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground";
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs ${cls}`}>
      {s === "clear" ? "Cleared" : `${naira(b)} ${s === "credit" ? "credit" : "owed"}`}
    </span>
  );
}

export const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const btnCls = "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60";
export const btn2Cls = "rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-accent";

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4" onClick={onClose}>
      <div className="my-auto w-full max-w-lg rounded-lg bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
