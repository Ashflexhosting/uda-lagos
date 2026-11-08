import { useEffect, useState } from "react";
import { addMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { lagosDate, meetingTime, villageMeetingDate, type MeetingNotice } from "@/lib/meetings";

type Village = MeetingNotice & { image_url: string | null };

export function VillageMeetingYearCalendar({ meetings }: { meetings: Village[] }) {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  useEffect(() => {
    const updateMonth = () => setCurrentMonth(new Date(`${lagosDate(new Date()).slice(0, 7)}-01T12:00:00`));
    updateMonth();
    const interval = window.setInterval(updateMonth, 60_000);
    return () => window.clearInterval(interval);
  }, []);
  if (!meetings.length || !currentMonth) return null;
  const month = addMonths(currentMonth, monthOffset);
  const date = villageMeetingDate(month);
  return <section aria-labelledby="annual-village-calendar" className="mt-8 border-b border-border pb-10">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-primary">Second Sunday · February–December</p>
        <h2 id="annual-village-calendar" className="mt-2 font-serif text-3xl font-bold">Village meeting calendar</h2>
      </div>
      <div className="flex items-center gap-2" aria-label="Browse meeting months">
        <Button variant="outline" size="icon" title="Previous month" aria-label="Previous month" onClick={() => setMonthOffset(offset => offset - 1)}><ChevronLeft /></Button>
        <p aria-live="polite" className="w-40 text-center text-lg font-semibold">{format(month, "MMMM yyyy")}</p>
        <Button variant="outline" size="icon" title="Next month" aria-label="Next month" onClick={() => setMonthOffset(offset => offset + 1)}><ChevronRight /></Button>
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
    <div aria-label="Selected month village meeting dates" className="border-t-2 border-primary pt-4">
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
    </div>
  </section>;
}