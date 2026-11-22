import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import hero from "@/assets/hero-gathering.jpg";
import pillarWelfare from "@/assets/pillar-welfare.jpg";
import pillarDevelopment from "@/assets/pillar-development.jpg";
import pillarFellowship from "@/assets/pillar-fellowship.jpg";
import { NextVillageMeetings, nextMeetingsQuery } from "@/components/next-village-meetings";
import { BirthdayAnnouncements, birthdaysQuery } from "@/components/birthday-announcements";

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(nextMeetingsQuery), context.queryClient.ensureQueryData(birthdaysQuery)]),
  head: () => ({
    meta: [
      { title: "UDA Lagos — Uzuakoli Development Association, Lagos Branch" },
      { name: "description", content: "Uzuakoli Development Association, Lagos Branch: uniting Uzuakoli sons and daughters in Lagos for welfare, development and fellowship." },
      { property: "og:title", content: "UDA Lagos — Uzuakoli Development Association" },
      { property: "og:description", content: "Uniting Uzuakoli people in Lagos for welfare, development and fellowship." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
  errorComponent: () => <SiteLayout><div className="mx-auto max-w-6xl px-6 py-16"><h1 className="font-serif text-3xl">UDA Lagos</h1><p className="mt-4">The page is temporarily unavailable. Please try again later.</p></div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><p className="px-6 py-16">Page not found.</p></SiteLayout>,
});

const pillars = [
  { t: "Welfare", d: "We stand with members in times of joy and loss — weddings, births, illness and bereavement — through our welfare levy.", img: pillarWelfare, alt: "Association members comforting and supporting a family" },
  { t: "Development", d: "Our development levy funds projects that improve life in Uzuakoli: roads, schools, water and community halls.", img: pillarDevelopment, alt: "Community members building a water project in Uzuakoli" },
  { t: "Fellowship", d: "Monthly meetings keep our culture, language and friendships strong for families living in Lagos.", img: pillarFellowship, alt: "Members seated in a circle at a monthly meeting" },
];

function Home() {
  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden">
        <img src={hero} alt="Members of the association gathered in conversation" width={1600} height={912} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/85 via-foreground/60 to-foreground/10" />
        <div className="mx-auto max-w-6xl px-6 py-28 text-background md:py-40">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] opacity-90">Lagos Branch · Est. community of Uzuakoli</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight text-gold-bright md:text-7xl">Together for Uzuakoli, wherever we are.</h1>
          <p className="mt-6 max-w-xl text-lg opacity-90">
            We are the sons and daughters of Uzuakoli living in Lagos — supporting one another and building a better home town.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/auth" className="rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">Member sign in</Link>
            <Link to="/about" className="rounded-md border border-background/60 px-6 py-3 font-medium hover:bg-background/10">About us</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-feature bg-feature text-feature-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 text-center md:grid-cols-4">
          {[["250+", "Registered members"], ["Monthly", "General meetings"], ["3", "Core programmes"], ["24/7", "Online member portal"]].map(([n, l]) => (
            <div key={l}><p className="font-serif text-3xl text-gold-bright md:text-4xl">{n}</p><p className="mt-1 text-sm text-feature-foreground/75">{l}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">What we do</p>
        <h2 className="mt-3 max-w-2xl font-serif text-4xl">Three commitments that hold us together</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.t} className="overflow-hidden rounded-xl border border-feature bg-feature text-feature-foreground">
              <img src={p.img} alt={p.alt} width={1024} height={768} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="p-8">
                <h3 className="font-serif text-2xl">{p.t}</h3>
                <p className="mt-3 text-feature-foreground/75">{p.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <NextVillageMeetings />

      <BirthdayAnnouncements />

      <section className="bg-secondary">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Member portal</p>
            <h2 className="mt-3 font-serif text-4xl">Your dues and balance, any time</h2>
            <p className="mt-4 text-muted-foreground">
              Sign in with your member number, email or Google to see your statement, upload proof of payment and keep your contact details up to date.
            </p>
            <Link to="/auth" className="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground">Open the portal</Link>
          </div>
          <ul className="space-y-4">
            {["View your balance and full payment history", "Upload bank receipts for confirmation", "Download or print your statement", "Update phone, email, address and photo"].map((t) => (
              <li key={t} className="flex items-center gap-4 rounded-lg bg-card p-5 shadow-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm text-primary-foreground">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-feature text-feature-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-serif text-4xl">From Uzuakoli and living in Lagos?</h2>
          <p className="mx-auto mt-4 max-w-xl text-feature-foreground/75">We'd love to welcome you. Get in touch to join the association or attend our next meeting.</p>
          <Link to="/contact" className="mt-8 inline-block rounded-md bg-gold px-6 py-3 font-medium text-feature hover:opacity-90">Contact us</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
