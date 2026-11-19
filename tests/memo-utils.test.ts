import { describe, expect, it } from "vitest";
import { checklistProgress, sortChecklistItems } from "@/core/memo-utils";

describe("checklist helpers", () => {
  it("calculates empty and completed progress", () => {
    expect(checklistProgress([])).toEqual({ completed: 0, total: 0, rate: 0 });
    expect(checklistProgress([{ is_completed: true, order_index: 0 }, { is_completed: false, order_index: 1 }])).toEqual({ completed: 1, total: 2, rate: 50 });
  });
  it("moves completed items below while preserving order_index", () => {
    const items = [{ id: "b", is_completed: true, order_index: 0 }, { id: "c", is_completed: false, order_index: 2 }, { id: "a", is_completed: false, order_index: 1 }];
    expect(sortChecklistItems(items).map((item) => item.id)).toEqual(["a", "c", "b"]);
  });
});
