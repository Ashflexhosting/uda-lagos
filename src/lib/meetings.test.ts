import { describe, expect, it } from "vitest";
import { lagosDate, meetingTime, nextVillageMeetings, type MeetingNotice } from "./meetings";

const notice = (id: string, date: string | null, kind = "meeting"): MeetingNotice => ({
  id, kind, title: id, event_date: date, body: "Time: 3:00 PM", location: "Ilasa, Lagos",
});

describe("next village meetings", () => {
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