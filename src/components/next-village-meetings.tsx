import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listPublishedUpdates } from "@/lib/updates.functions";
import { lagosDate, meetingTime, nextVillageMeetings } from "@/lib/meetings";

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
  return <section aria-labelledby="village-meetings-heading" className="border-b border-border bg-secondary">
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Meetings</p>
          <h2 id="village-meetings-heading" className="mt-2 font-serif text-3xl">Next village meetings</h2>
        </div>
        <Button asChild variant="outline"><Link to="/news">View meeting notices <ArrowRight /></Link></Button>
      </div>
      {date && <p className="mt-6 flex items-center gap-2 font-semibold text-primary"><CalendarDays className="size-5 shrink-0" /><time dateTime={date}>{new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00+01:00`))}</time></p>}
      {data.meetings.length > 0 ? <div className="mt-6 grid gap-8 md:grid-cols-3">
        {data.meetings.map((meeting) => <article key={meeting.id} className="min-w-0 border-t border-border pt-5">
          <h3 className="break-words font-serif text-xl">{meeting.title}</h3>
          <p className="mt-4 flex items-center gap-2 text-sm font-medium"><Clock className="size-4 shrink-0 text-primary" />{meetingTime(meeting.body) ?? "Time to be confirmed"}</p>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><MapPin className="mt-1 size-4 shrink-0 text-primary" /><span className="break-words">{meeting.location || "Venue to be confirmed"}</span></p>
        </article>)}
      </div> : <p className="mt-6 text-muted-foreground">{data.unavailable ? "Meeting notices are temporarily unavailable. Please try again later." : "No upcoming village meeting notices have been published yet."}</p>}
    </div>
  </section>;
}