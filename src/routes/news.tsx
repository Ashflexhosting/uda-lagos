import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Newspaper } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { listPublishedUpdates } from "@/lib/updates.functions";

const updatesQuery = queryOptions({ queryKey: ["published-updates"], queryFn: () => listPublishedUpdates() });
export const Route = createFileRoute("/news")({
  loader: ({ context }) => context.queryClient.ensureQueryData(updatesQuery),
  head: () => ({ meta: [
    { title: "News & Events — UDA Lagos Branch" },
    { name: "description", content: "Latest association news and events from Uzuakoli Development Association, Lagos Branch." },
    { property: "og:title", content: "News & Events — UDA Lagos Branch" },
    { property: "og:description", content: "Association announcements, community news and upcoming events." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: News,
  errorComponent: () => <SiteLayout><div className="mx-auto max-w-6xl px-6 py-16"><h1 className="font-serif text-3xl">News & Events</h1><p className="mt-6 text-muted-foreground">News is temporarily unavailable. Please try again later.</p></div></SiteLayout>,
});

function News() {
  const { data: updates } = useSuspenseQuery(updatesQuery);
  const [filter, setFilter] = useState<"all" | "news" | "event">("all");
  const visible = updates.filter((item) => filter === "all" || item.kind === filter);
  return <SiteLayout>
    <section className="bg-primary text-primary-foreground"><div className="mx-auto max-w-6xl px-6 py-16"><p className="mb-3 text-sm uppercase">UDA Lagos Branch</p><h1 className="font-serif text-4xl">News & Events</h1></div></section>
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex gap-2" aria-label="Filter updates">{([['all', 'All'], ['news', 'News'], ['event', 'Events']] as const).map(([value, label]) => <Button key={value} variant={filter === value ? "default" : "outline"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div>
      {!visible.length && <div className="border-t border-border py-12"><Newspaper className="mb-4 size-8 text-primary"/><p className="font-serif text-xl">No {filter === 'event' ? 'events' : filter === 'news' ? 'news' : 'updates'} published yet.</p></div>}
      <div className="divide-y divide-border">{visible.map((item) => <article key={item.id} className="py-8 first:pt-0">
        <p className="mb-2 text-sm font-medium uppercase text-primary">{item.kind === 'event' ? 'Event' : 'News'}</p>
        <h2 className="break-words font-serif text-2xl">{item.title}</h2>
        <div className="my-4 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><CalendarDays className="size-4"/>{new Date(`${item.event_date ?? item.created_at.slice(0,10)}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>{item.location && <span className="flex items-center gap-2"><MapPin className="size-4"/>{item.location}</span>}</div>
        <p className="max-w-3xl whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">{item.body}</p>
      </article>)}</div>
    </section>
  </SiteLayout>;
}