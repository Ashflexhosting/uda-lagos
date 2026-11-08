import { describe, expect, it } from "vitest";
import { lagosDate, meetingTime, nextVillageMeetings, nextVillageMeetingDate, recurringVillageMeetings, villageMeetingDate, type MeetingNotice } from "./meetings";

const notice = (id: string, date: string | null, kind = "meeting"): MeetingNotice => ({
  id, kind, title: id, event_date: date, body: "Time: 3:00 PM", location: "Ilasa, Lagos",
});

describe("next village meetings", () => {
  it("uses the second Sunday and keeps the meeting visible on its day", () => {
    expect(nextVillageMeetingDate("2026-11-08")).toBe("2026-11-08");
    expect(nextVillageMeetingDate("2026-11-09")).toBe("2026-12-13");
  });
  it("has no January meeting and rolls December forward to February", () => {
    expect(villageMeetingDate(new Date("2027-01-01T12:00:00"))).toBeNull();
    expect(nextVillageMeetingDate("2026-12-14")).toBe("2027-02-14");
    expect(nextVillageMeetingDate("2027-01-10")).toBe("2027-02-14");
  });
  it("handles leap years and Sundays on the first day of a month", () => {
    expect(nextVillageMeetingDate("2028-02-01")).toBe("2028-02-13");
    expect(nextVillageMeetingDate("2027-08-01")).toBe("2027-08-08");
  });
  it("rolls village dates without altering times, venues or news and events", () => {
    const rows = [notice("village", "2026-11-08"), notice("news", null, "news"), notice("event", "2026-11-08", "event")];
    const result = recurringVillageMeetings(rows, "2026-11-09");
    expect(result[0]).toEqual({ ...rows[0], original_event_date: "2026-11-08", event_date: "2026-12-13" });
    expect(result[1]?.event_date).toBeNull();
    expect(result[2]?.event_date).toBe("2026-11-08");
    expect(rows[0]?.event_date).toBe("2026-11-08");
  });
  it("keeps separate villages on Sunday 8 November 2026 together", () => {
    const rows = [notice("Ahia Afor Ogwuanyim", "2026-11-08"), notice("Oganihu Amankwo", "2026-11-08"), notice("Odilamma Eluoma", "2026-11-08"), notice("later", "2026-12-13")];
    expect(nextVillageMeetings(rows, "2026-11-06").map((row) => row.id)).toEqual(["Ahia Afor Ogwuanyim", "Odilamma Eluoma", "Oganihu Amankwo"]);
  });
  it("excludes past dates, undated notices, news and events", () => {
    expect(nextVillageMeetings([notice("past", "2026-11-08"), notice("undated", null), notice("news", "2026-11-10", "news"), notice("event", "2026-11-10", "event"), notice("next", "2026-12-13")], "2026-11-09").map((row) => row.id)).toEqual(["next"]);
  });
  it("includes today's meetings and does not invent future recurrences", () => {
    expect(nextVillageMeetings([notice("today", "2026-11-08")], "2026-11-08")).toHaveLength(1);
    expect(nextVillageMeetings([notice("past", "2026-11-08")], "2026-11-09")).toEqual([]);
  });
  it("reads 3pm from each existing notice format", () => {
    for (const body of ["Time: 3:00pm", "Time: 3:00 PM", "Our time still remains 3pm prompt."]) {
      expect(meetingTime(body)).toBe("3:00 PM");
    }
    expect(meetingTime("No time supplied")).toBeNull();
  });
  it("uses the Lagos calendar date at the UTC day boundary", () => {
    expect(lagosDate(new Date("2026-11-07T23:30:00Z"))).toBe("2026-11-08");
  });
});