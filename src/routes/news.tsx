import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CalendarDays, Clock, MapPin, Newspaper, Users } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { Button } from "@/components/ui/button";
import { listPublishedUpdates } from "@/lib/updates.functions";
import { meetingTime } from "@/lib/meetings";
import emblem from "@/assets/uda-emblem.png.asset.json";
import { VillageMeetingYearCalendar } from "@/components/village-meeting-year-calendar";

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
  const [filter, setFilter] = useState<"all" | "news" | "event" | "meeting">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visible = updates.filter((item) => filter === "all" || item.kind === filter);
  const categories = [['all', 'All updates', Newspaper], ['news', 'News', Newspaper], ['event', 'Events', CalendarDays], ['meeting', 'Meetings', Users]] as const;
  function toggleNotice(id: string) {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  return <SiteLayout>
    <section className="overflow-hidden bg-meetings text-meetings-foreground">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 md:px-6 md:pb-12 md:pt-16">
        <div className="flex items-center gap-3 text-sm font-semibold text-gold-bright"><span className="h-px w-8 bg-gold-bright" aria-hidden="true" />UDA Lagos Branch</div>
        <div className="mt-5 flex items-center justify-between gap-6">
          <h1 className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">News <span className="text-gold-bright">&</span> Events</h1>
          <img src={emblem.url} alt="Uzuakoli Development Association emblem" width={112} height={112} className="hidden size-28 shrink-0 object-contain sm:block" />
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-meetings-foreground/20 pt-5">
          <p className="text-sm text-meetings-foreground/80">Uzuakoli Development Association, Lagos Branch</p>
          <span className="flex items-center gap-2 text-sm font-medium text-gold-bright"><Newspaper className="size-4" />Community bulletin</span>
        </div>
      </div>
    </section>
    <section className="mx-auto w-full max-w-6xl px-5 py-8 md:px-6 md:py-10">
      <div className="flex flex-wrap gap-2 border-b border-border pb-6" aria-label="Filter updates">
        {categories.map(([value, label, Icon]) => {
          const count = value === 'all' ? updates.length : updates.filter(item => item.kind === value).length;
          return <Button key={value} variant={filter === value ? "default" : "ghost"} className="h-11 gap-2 rounded-md px-3 sm:px-4" aria-pressed={filter === value} onClick={() => setFilter(value)}><Icon className="size-4" /><span>{label}</span><span className="ml-1 text-xs opacity-70">{count}</span></Button>;
        })}
      </div>
      {(filter === 'all' || filter === 'meeting') && <VillageMeetingYearCalendar meetings={updates.filter(item => item.kind === 'meeting')} />}
      <div className="mb-6 mt-8 flex items-center justify-between gap-4"><h2 className="font-serif text-2xl">{filter === 'all' ? 'Latest updates' : filter === 'meeting' ? 'Village meetings' : filter === 'event' ? 'Events' : 'Association news'}</h2><span className="text-sm text-muted-foreground">{visible.length} {visible.length === 1 ? 'notice' : 'notices'}</span></div>
      {!visible.length && <div className="py-16 text-center"><Newspaper className="mx-auto mb-4 size-9 text-primary"/><p className="font-serif text-xl">No {filter === 'event' ? 'events' : filter === 'meeting' ? 'meetings' : filter === 'news' ? 'news' : 'updates'} published yet.</p></div>}
      <div className="grid items-start gap-6 md:grid-cols-2">{visible.map((item) => {
        const dateString = item.event_date ?? item.created_at.slice(0,10);
        const date = new Date(`${dateString}T12:00:00+01:00`);
        const isNews = item.kind === 'news';
        const open = expanded.has(item.id);
        const largePhoto = item.kind === 'event' ? item.image_url : null;
        const time = meetingTime(item.body);
        const titleParts = item.title.split(/\s+[—–]\s+/);
        const title = titleParts[0];
        const subtitle = titleParts.slice(1).join(' — ');
        return <article key={item.id} className={`min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground ${isNews ? 'border-feature/30' : 'border-border'}`}>
          <div className={`flex items-center justify-between gap-4 px-6 py-3 ${isNews ? 'bg-feature text-feature-foreground' : 'bg-meetings text-meetings-foreground'}`}>
            <p className="flex items-center gap-2 text-xs font-bold uppercase">{isNews ? <Newspaper className="size-4" /> : item.kind === 'meeting' ? <Users className="size-4" /> : <CalendarDays className="size-4" />}{item.kind === 'event' ? 'Event' : item.kind === 'meeting' ? 'Meeting' : 'News'}</p>
            <time dateTime={dateString} className="text-xs opacity-80">{date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })}</time>
          </div>
          <div className="p-5 sm:p-6">
            {largePhoto && <figure className="mb-6 flex flex-col items-center"><img src={largePhoto} alt={`Portrait of ${title}`} loading="lazy" className="max-h-[22rem] w-auto rounded-lg border border-border bg-card object-contain shadow-sm" /><span className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">In loving memory</span></figure>}
            <div className="flex items-start gap-4">
              {!largePhoto && (item.image_url ? <img src={item.image_url} alt={`${title} logo`} width={72} height={72} loading="lazy" className="size-[72px] shrink-0 rounded-md border border-border bg-card object-contain p-1" /> : <div className={`flex size-[72px] shrink-0 items-center justify-center rounded-md ${isNews ? 'bg-feature/10 text-feature' : 'bg-primary/10 text-primary'}`}><Newspaper className="size-7" /></div>)}
              <div className="min-w-0"><h3 className={`break-words font-serif text-2xl leading-snug ${item.kind === 'meeting' ? 'font-bold' : ''}`}>{title}</h3>{subtitle && <p className="mt-2 text-sm font-semibold text-primary">{subtitle}</p>}</div>
            </div>
            <div className="mt-6 flex items-center gap-4 border-y border-border py-4">
              <div className="w-14 shrink-0 border-r border-border pr-4 text-center"><span className="block text-3xl font-semibold leading-none text-primary">{date.getDate()}</span><span className="mt-1 block text-xs font-semibold uppercase text-muted-foreground">{date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Africa/Lagos' })}</span></div>
              <div className="min-w-0"><p className="text-sm font-semibold">{date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' })}</p>{time && <p className="mt-1 flex items-center gap-2 text-sm text-primary"><Clock className="size-4" />{time}</p>}</div>
            </div>
            {item.location && <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="break-words">{item.location}</span></p>}
             {item.kind === 'meeting' && item.original_event_date && item.original_event_date !== item.event_date && <p className="mt-5 text-xs font-semibold text-muted-foreground">Original notice · {new Date(`${item.original_event_date}T12:00:00+01:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' })}</p>}
             <p id={`notice-${item.id}`} className={`mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground ${open ? '' : 'line-clamp-3'}`}>{item.body}</p>
            <Button variant="ghost" aria-expanded={open} aria-controls={`notice-${item.id}`} onClick={() => toggleNotice(item.id)} className="mt-5 h-10 w-full justify-between rounded-none border-t border-border px-0 text-primary hover:bg-transparent">{open ? 'Close notice' : 'Read full notice'}{open ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}</Button>
          </div>
        </article>;
      })}</div>
    </section>
    <NewsletterSignup />
  </SiteLayout>;
}