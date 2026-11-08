import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPublishedUpdates } from "@/lib/updates.functions";
import { lagosDate, meetingTime, nextVillageMeetings } from "@/lib/meetings";
import { VillageMeetingCalendar } from "@/components/village-meeting-calendar";

export const nextMeetingsQuery = queryOptions({
  queryKey: ["published-updates", "homepage-next-meetings"],
  queryFn: async () => {
    try {
      const updates = await listPublishedUpdates();
      return { meetings: nextVillageMeetings(updates, lagosDate(new Date())), unavailable: false };
    } catch {
      return { meetings: [], unavailable: true };
    }
  },
  staleTime: 0,
});

export function NextVillageMeetings() {
  const { data } = useSuspenseQuery(nextMeetingsQuery);
  const date = data.meetings[0]?.event_date;
  return <section aria-labelledby="village-meetings-heading" className="bg-meetings text-meetings-foreground">
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-3 text-sm font-semibold text-gold-bright"><span className="h-px w-8 bg-gold-bright" aria-hidden="true" />Meetings</p>
          <h2 id="village-meetings-heading" className="mt-3 font-serif text-3xl md:text-4xl">Next village meetings</h2>
        </div>
        <Button asChild variant="outline" className="border-meetings-foreground/30 bg-transparent text-meetings-foreground hover:bg-meetings-foreground/10 hover:text-meetings-foreground"><Link to="/news">View meeting notices <ArrowRight /></Link></Button>
      </div>
      {date && <div className="mt-8"><VillageMeetingCalendar nextDate={date} /></div>}
      {date && <p className="mt-8 flex items-center gap-3 border-t border-meetings-foreground/20 pt-6 font-semibold text-gold-bright"><CalendarDays className="size-5 shrink-0" /><time dateTime={date}>{new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00+01:00`))}</time></p>}
      {data.meetings.length > 0 ? <div className="mt-7 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.meetings.map((meeting) => <article key={meeting.id} className="flex min-w-0 flex-col rounded-lg border-t-4 border-gold bg-card p-6 text-card-foreground">
          <div className="flex items-start gap-4">
            {meeting.image_url && <img src={meeting.image_url} alt={`${meeting.title.split(/\s+[—–]\s+/)[0]} logo`} width={64} height={64} loading="lazy" className="size-16 shrink-0 rounded-md object-contain" />}
            <div className="min-w-0">
              <h3 className="break-words font-serif text-2xl leading-snug">{meeting.title.split(/\s+[—–]\s+/)[0]?.replace(/\s+Lagos Branch$/i, "")}</h3>
              <p className="mt-2 break-words text-sm font-medium text-primary">{meeting.title.split(/\s+[—–]\s+/).slice(1).join(" — ") || meeting.title}</p>
            </div>
          </div>
          <div className="mt-6 flex-1 border-t border-border pt-5">
            <p className="flex items-center gap-3 font-semibold"><Clock className="size-5 shrink-0 text-primary" />{meetingTime(meeting.body) ?? "Time to be confirmed"}</p>
            <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"><MapPin className="mt-1 size-5 shrink-0 text-primary" /><span className="break-words">{meeting.location || "Venue to be confirmed"}</span></p>
          </div>
        </article>)}
      </div> : <p className="mt-6 text-meetings-foreground/80">{data.unavailable ? "Meeting notices are temporarily unavailable. Please try again later." : "No upcoming village meeting notices have been published yet."}</p>}
    </div>
  </section>;
}