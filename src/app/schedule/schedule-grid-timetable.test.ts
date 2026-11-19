import { describe, expect, it } from "vitest";
import { parseClockMinutes, splitScheduleEntry } from "./schedule-grid-timetable";

describe("schedule sleep time placement", () => {
  it("parses HH:mm as minutes", () => {
    expect(parseClockMinutes("23:45")).toBe(1425);
    expect(parseClockMinutes("06:30")).toBe(390);
  });

  it.each([
    ["23:45", "06:30", 2],
    ["22:00", "07:00", 2],
    ["00:00", "06:00", 1],
    ["01:30", "08:15", 2],
  ])("splits %s-%s at column boundaries", (start, end, count) => {
    const startMinutes = parseClockMinutes(start);
    const endMinutes = parseClockMinutes(end);
    const segments = splitScheduleEntry({ id: "sleep", title: "숙면", start: startMinutes / 60, end: endMinutes / 60, kind: "todo" });
    expect(segments).toHaveLength(count);
    expect(segments.every(segment => segment.end > segment.start)).toBe(true);
  });

  it("keeps the 23:45 and 06:30 partial offsets", () => {
    const segments = splitScheduleEntry({ id: "sleep", title: "숙면", start: 23.75, end: 6.5, kind: "todo" });
    expect(segments[0]).toMatchObject({ start: 7.75, end: 8, column: 2 });
    expect(segments.at(-1)).toMatchObject({ start: 0, end: 6.5, column: 0 });
  });
});
