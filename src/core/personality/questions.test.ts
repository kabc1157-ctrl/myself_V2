import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_ITEMS,
  ASSESSMENT_ITEM_COUNT,
  ASSESSMENT_SCALE,
  PERSONALITY_DIMENSIONS,
  assessmentGroup,
} from "./questions";

describe("personality questionnaire configuration", () => {
  it("contains exactly 35 unique, ordered questions", () => {
    expect(ASSESSMENT_ITEM_COUNT).toBe(35);
    expect(ASSESSMENT_ITEMS.map((item) => item.id))
      .toEqual(Array.from({ length: 35 }, (_, i) => `q${i + 1}`));
    expect(new Set(ASSESSMENT_ITEMS.map((item) => item.text)).size).toBe(35);
  });

  it("keeps each of 10 dimensions represented by at least 3 items", () => {
    const counts = Object.fromEntries(PERSONALITY_DIMENSIONS.map((dim) =>
      [dim, ASSESSMENT_ITEMS.filter((item) => item.dimension === dim).length],
    ));
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(35);
    expect(Object.values(counts).every((n) => n >= 3)).toBe(true);
    expect(PERSONALITY_DIMENSIONS.slice(0, 5).map((dim) => counts[dim]))
      .toEqual([4, 4, 4, 4, 4]);
    expect(PERSONALITY_DIMENSIONS.slice(5, 7).map((dim) => counts[dim]))
      .toEqual([3, 3]);
    expect(PERSONALITY_DIMENSIONS.slice(7).map((dim) => counts[dim]))
      .toEqual([3, 3, 3]);
    expect(PERSONALITY_DIMENSIONS.every((dim) =>
      ASSESSMENT_ITEMS.some((item) => item.dimension === dim && item.reverseScored),
    )).toBe(true);
  });

  it("uses five response options and correct group boundaries", () => {
    expect(ASSESSMENT_SCALE.map((option) => option.value))
      .toEqual(["1", "2", "3", "4", "5"]);
    expect(ASSESSMENT_ITEMS.every((item) => item.text.trim().length > 0)).toBe(true);
    expect(assessmentGroup(0).title).toContain("성격");
    expect(assessmentGroup(19).title).toContain("성격");
    expect(assessmentGroup(20).title).toContain("동기");
    expect(assessmentGroup(25).title).toContain("동기");
    expect(assessmentGroup(26).title).toContain("실행");
    expect(assessmentGroup(34).title).toContain("실행");
  });
});
