import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_ITEMS,
  ASSESSMENT_ITEM_COUNT,
  ASSESSMENT_SCALE,
  assessmentGroup,
} from "./questions";

describe("P1 personality assessment item configuration", () => {
  it("contains exactly 35 unique, numbered questions", () => {
    expect(ASSESSMENT_ITEM_COUNT).toBe(35);
    expect(ASSESSMENT_ITEMS.map((item) => item.id))
      .toEqual(Array.from({ length: 35 }, (_, i) => `q${i + 1}`));
    expect(new Set(ASSESSMENT_ITEMS.map((item) => item.text)).size).toBe(35);
  });

  it("allocates 20 Big Five, 11 motivation, and 4 execution items", () => {
    const dimensions = ASSESSMENT_ITEMS.map((item) => item.dimension);
    expect(dimensions.slice(0, 20)).toEqual([
      ...Array(4).fill("openness"),
      ...Array(4).fill("conscientiousness"),
      ...Array(4).fill("extraversion"),
      ...Array(4).fill("agreeableness"),
      ...Array(4).fill("emotional_sensitivity"),
    ]);
    expect(dimensions.slice(20, 31)).toEqual([
      ...Array(6).fill("promotion"),
      ...Array(5).fill("prevention"),
    ]);
    expect(dimensions.slice(31)).toEqual([
      "time_centered", "time_centered", "cue_centered", "flexible_execution",
    ]);
  });

  it("keeps only defined five-point answer options", () => {
    expect(ASSESSMENT_SCALE.map((option) => option.value))
      .toEqual(["1", "2", "3", "4", "5"]);
    expect(ASSESSMENT_ITEMS.every((item) => item.text.trim().length > 0)).toBe(true);
    expect(ASSESSMENT_ITEMS.every((item) => typeof item.reverseCandidate === "boolean")).toBe(true);
    expect(assessmentGroup(0).title).toContain("성격");
    expect(assessmentGroup(20).title).toContain("동기");
    expect(assessmentGroup(31).title).toContain("실행");
  });
});
