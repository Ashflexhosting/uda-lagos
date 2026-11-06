export type MeetingNotice = {
  id: string;
  kind: string;
  title: string;
  body: string;
  event_date: string | null;
  location: string | null;
};

export function lagosDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function meetingTime(body: string): string | null {
  const match = body.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
  if (!match) return null;
  return `${Number(match[1])}:${match[2] ?? "00"} ${match[3].replaceAll(".", "").toUpperCase()}`;
}

export function nextVillageMeetings<T extends MeetingNotice>(updates: T[], today: string): T[] {
  const upcoming = updates.filter((item) => item.kind === "meeting" && item.event_date && item.event_date >= today)
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? "") || a.title.localeCompare(b.title));
  const nextDate = upcoming[0]?.event_date;
  return nextDate ? upcoming.filter((item) => item.event_date === nextDate) : [];
}