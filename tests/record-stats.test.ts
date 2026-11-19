import { describe, expect, it } from "vitest";
import { average, completionRate, representativeEmotion } from "@/core/records/record-stats";

describe("record summaries", () => {
  it("calculates diary emotion averages from 1-5 scores", () => {
    expect(average([5, 3, 2])).toBe(3.3);
    expect(average([])).toBeNull();
  });
  it("uses the emotion closest to the same-day average", () => {
    expect(representativeEmotion([{ emotion_emoji: "😄", emotion_score: 5 }, { emotion_emoji: "😐", emotion_score: 3 }, { emotion_emoji: "😟", emotion_score: 2 }])).toBe("😐");
  });
  it("calculates routine completion percentages", () => {
    expect(completionRate(4, 3)).toBe(75);
    expect(completionRate(0, 0)).toBe(0);
  });
});
