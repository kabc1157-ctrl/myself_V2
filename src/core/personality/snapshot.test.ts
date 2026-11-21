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

  it("accepts every uniform response and diverse deterministic response patterns", () => {
    const patterns = [
      ...[1, 2, 3, 4, 5].map(value => ASSESSMENT_ITEMS.map(() => String(value))),
      ...Array.from({ length: 20 }, (_, seed) =>
        ASSESSMENT_ITEMS.map((_, index) => String(1 + ((index * (seed + 1) + seed) % 5))),
      ),
    ];
    for (const values of patterns) {
      const answers = Object.fromEntries(ASSESSMENT_ITEMS.map((item, index) => [item.id, values[index]]));
      const { report } = createPersonalityReport(answers);
      expect(isPersonalityReportSnapshot(JSON.parse(JSON.stringify(report)))).toBe(true);
      expect(Object.keys(report.sections)).toHaveLength(7);
    }
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
