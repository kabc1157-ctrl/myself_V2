import { describe, expect, it } from "vitest";
import { ASSESSMENT_ITEMS } from "./questions";
import { createPersonalityReport } from "./report";
import { isPersonalityReportSnapshot } from "./snapshot";

function report() {
  return createPersonalityReport(Object.fromEntries(ASSESSMENT_ITEMS.map(item => [item.id, "3"]))).report;
}

describe("saved personality report", () => {
  it("accepts a generated report after JSON round-trip", () => {
    expect(isPersonalityReportSnapshot(JSON.parse(JSON.stringify(report())))).toBe(true);
  });

  it("accepts reports including matching combinations", () => {
    const answers = Object.fromEntries(ASSESSMENT_ITEMS.map(item => [item.id, item.reverseScored ? "1" : "5"]));
    const result = createPersonalityReport(answers).report;
    expect(result.sections.connections.items.length).toBeGreaterThan(0);
    expect(isPersonalityReportSnapshot(result)).toBe(true);
  });

  it("rejects missing titles and malformed nested data without mutating the snapshot", () => {
    const valid = report();
    const malformed = [
      { ...valid, headline: "" },
      { ...valid, reportVersion: "unknown" },
      { ...valid, sections: { ...valid.sections, summary: { ...valid.sections.summary, title: undefined } } },
      { ...valid, sections: { ...valid.sections, summary: { ...valid.sections.summary, prominent: [null] } } },
      { ...valid, sections: { ...valid.sections, connections: { ...valid.sections.connections, items: [null] } } },
      { ...valid, sections: { ...valid.sections, personality: { ...valid.sections.personality, dimensions: [] } } },
      { ...valid, sections: { ...valid.sections, strategies: { ...valid.sections.strategies, items: [{}] } } },
      { ...valid, sections: { ...valid.sections, strengthsAndWatchouts: { ...valid.sections.strengthsAndWatchouts, watchouts: [null] } } },
    ];
    for (const item of malformed) {
      const before = JSON.stringify(item);
      expect(isPersonalityReportSnapshot(item)).toBe(false);
      expect(JSON.stringify(item)).toBe(before);
    }
  });
});
