import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { meetingTime, villageMeetingDate, type MeetingNotice } from "@/lib/meetings";

type Village = MeetingNotice & { image_url: string | null };

export function VillageMeetingYearCalendar({ meetings }: { meetings: Village[] }) {
  const [year, setYear] = useState(() => Number(meetings[0]?.event_date?.slice(0, 4)));
  if (!meetings.length || !Number.isFinite(year)) return null;
  return <section aria-labelledby="annual-village-calendar" className="mt-8 border-b border-border pb-10">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-primary">Second Sunday · February–December</p>
        <h2 id="annual-village-calendar" className="mt-2 font-serif text-3xl font-bold">Village meeting calendar</h2>
      </div>
      <div className="flex items-center gap-3" aria-label="Calendar year">
        <Button variant="outline" size="icon" aria-label="Previous year" onClick={() => setYear(current => current - 1)}><ChevronLeft /></Button>
        <span className="w-16 text-center text-xl font-semibold" aria-live="polite">{year}</span>
        <Button variant="outline" size="icon" aria-label="Next year" onClick={() => setYear(current => current + 1)}><ChevronRight /></Button>
      </div>
    </div>
    <div className="my-8 grid gap-x-8 sm:grid-cols-2">
      {meetings.map(meeting => {
        const name = meeting.title.split(/\s+[—–]\s+/)[0]?.replace(/\s+Lagos Branch$/i, "") ?? meeting.title;
        return <article key={meeting.id} className="flex min-w-0 items-start gap-4 border-t border-border py-5">
          {meeting.image_url ? <img src={meeting.image_url} alt={`${name} logo`} width={64} height={64} loading="lazy" className="size-16 shrink-0 rounded-md bg-card object-contain" /> : <div aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-primary"><Users className="size-7" /></div>}
          <div className="min-w-0">
            <h3 className="break-words font-serif text-xl font-bold">{name}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary"><Clock className="size-4 shrink-0" />{meetingTime(meeting.body) ?? "Time to be confirmed"}</p>
            <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"><MapPin className="mt-1 size-4 shrink-0" /><span className="break-words">{meeting.location || "Venue to be confirmed"}</span></p>
          </div>
        </article>;
      })}
    </div>
    <div className="grid justify-items-center gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label={`${year} village meeting dates`}>
      {Array.from({ length: 12 }, (_, index) => {
        const month = new Date(year, index, 1, 12);
        const date = villageMeetingDate(month);
        return <div key={`${year}-${index}`} className="w-full min-w-0 border-t-2 border-primary pt-3">
          <Calendar
            aria-label={`${format(month, "MMMM yyyy")} village meetings`}
            month={month}
            mode="single"
            selected={date ?? undefined}
            onSelect={() => {}}
            hideNavigation
            showOutsideDays={false}
            weekStartsOn={0}
            className="mx-auto p-0"
          />
          <p className={`mt-3 text-center text-sm font-semibold ${date ? 'text-primary' : 'text-muted-foreground'}`}>{date ? <time dateTime={format(date, "yyyy-MM-dd")}>{format(date, "EEE, d MMMM")}</time> : "No meetings in January"}</p>
        </div>;
      })}
    </div>
  </section>;
}