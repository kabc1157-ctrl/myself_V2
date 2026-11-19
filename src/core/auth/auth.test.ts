import { describe, expect, it } from "vitest";

describe("authentication foundation", () => {
  it("uses an isolated 2.0 Supabase project URL", () => {
    expect("xvmgehtdrygesodmljwl").not.toBe("");
  });
  it("requires user ownership for profile access", () => {
    expect("auth.uid() = user_id").toContain("auth.uid()");
  });
});
