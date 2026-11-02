import { createFileRoute, Link } from "@tanstack/react-router";
import { ASSOCIATION } from "@/lib/members";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UDA Lagos — Member Portal" },
      { name: "description", content: "Sign in to view your UDA Lagos dues, levies, payments and balance, or manage the association's members." },
      { property: "og:title", content: "UDA Lagos — Member Portal" },
      { property: "og:description", content: "Members check balances and statements; officers manage dues and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">{ASSOCIATION}</p>
          <h1 className="mt-3 max-w-2xl font-serif text-5xl md:text-6xl">Member Portal</h1>
          <p className="mt-4 max-w-xl text-lg opacity-85">
            Check your dues and balance, upload payment receipts and download your statement — all in one place.
          </p>
          <Link to="/auth" className="mt-8 inline-block rounded-md bg-background px-6 py-3 font-medium text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-14 md:grid-cols-3">
        {[
          ["Your balance", "See what you've paid in 2026 and what is outstanding, line by line."],
          ["Send proof of payment", "Upload a bank receipt; an officer confirms it and your balance updates."],
          ["For officers", "Record payments, manage members, set yearly dues and export statements."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-serif text-xl">{t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
