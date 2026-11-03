import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — UDA Lagos Branch" },
      { name: "description", content: "Who we are: the Lagos Branch of the Uzuakoli Development Association, our mission, values and how membership works." },
      { property: "og:title", content: "About the Uzuakoli Development Association, Lagos" },
      { property: "og:description", content: "Our mission, values and how membership works." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs uppercase tracking-[0.3em] opacity-70">About us</p>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl md:text-6xl">A home away from home for Uzuakoli people in Lagos</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.4fr]">
        <h2 className="font-serif text-3xl">Who we are</h2>
        <div className="space-y-4 text-lg text-muted-foreground">
          <p>The Uzuakoli Development Association (UDA), Lagos Branch, brings together indigenes of Uzuakoli who live and work in Lagos. Members come from every walk of life — traders, professionals, clergy, chiefs and young people starting out.</p>
          <p>We meet regularly to support one another, keep our culture alive and pool our resources for the development of our home town.</p>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-20 md:grid-cols-3">
          {[
            ["Our mission", "To unite Uzuakoli people in Lagos and channel our collective strength into the welfare of members and the development of Uzuakoli."],
            ["Our values", "Unity, honesty, accountability and respect for our elders and traditions."],
            ["Accountability", "Every member's dues and payments are recorded and visible to them through the member portal."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-card p-8 shadow-sm">
              <h3 className="font-serif text-2xl">{t}</h3>
              <p className="mt-3 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-serif text-3xl">Membership</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ["Annual dues", "Paid by every registered member to support the running of the association."],
            ["Welfare levy", "Funds support for members at important moments in life."],
            ["Development levy", "Contributes to projects back home in Uzuakoli."],
          ].map(([t, d]) => (
            <div key={t} className="border-l-2 border-primary pl-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-serif text-xl">How to pay</h3>
          <BankAccounts className="mt-3" />
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <Link to="/contact" className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground">Join the association</Link>
          <Link to="/auth" className="rounded-md border border-input px-6 py-3 font-medium hover:bg-accent">Member sign in</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
