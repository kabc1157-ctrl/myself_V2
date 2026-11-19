import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ActivityCalendar, CollapsibleRecordCard } from "./record-kit";

describe("record kit", () => {
  it("renders a complete Monday-first monthly calendar including empty dates", () => {
    const html = renderToStaticMarkup(<ActivityCalendar month="2026-11" selectedDate="2026-11-12" values={[{ date: "2026-11-12", label: "🙂" }]} onDateSelect={() => undefined} onMonthChange={() => undefined} />);
    expect(html).toContain("2026년 11월");
    expect(html).toContain("11월 1일 기록 없음");
    expect(html).toContain("11월 12일 🙂");
    expect(html).toContain("is-selected");
    expect((html.match(/role="gridcell"/g) ?? []).length).toBe(30);
  });

  it("keeps a record form closed until explicitly opened", () => {
    const closed = renderToStaticMarkup(<CollapsibleRecordCard title="일기 쓰기" open={false} onOpenChange={() => undefined}><span>작성 폼</span></CollapsibleRecordCard>);
    const open = renderToStaticMarkup(<CollapsibleRecordCard title="일기 쓰기" open onOpenChange={() => undefined}><span>작성 폼</span></CollapsibleRecordCard>);
    expect(closed).not.toContain("작성 폼");
    expect(open).toContain("작성 폼");
  });
});

