import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { villageMeetingDate } from "@/lib/meetings";

export function VillageMeetingCalendar({ nextDate }: { nextDate: string }) {
  const [month, setMonth] = useState(() => new Date(`${nextDate}T12:00:00`));
  const meetingDate = villageMeetingDate(month);
  return <div className="flex flex-col items-start gap-6 border-y border-border bg-background p-4 text-foreground sm:flex-row sm:items-center sm:gap-10">
    <Calendar
      aria-label="Village meeting calendar"
      month={month}
      onMonthChange={setMonth}
      mode="single"
      selected={meetingDate ?? undefined}
      onSelect={() => {}}
      showOutsideDays={false}
      weekStartsOn={0}
      className="mx-auto shrink-0 p-0 sm:mx-0"
    />
    <div className="min-w-0 flex-1">
      <h3 className="font-serif text-2xl font-bold">Village meeting calendar</h3>
      <p className="mt-3 font-semibold text-primary">{meetingDate ? format(meetingDate, "EEEE, d MMMM yyyy") : "January — no village meetings"}</p>
      <p className="mt-2 text-sm text-muted-foreground">Second Sunday of each month · No meetings in January</p>
    </div>
  </div>;
}