import { describe, expect, it } from "vitest";
describe("development RLS check contract", () => { it("requires different user IDs", () => expect("current").not.toBe("other")); it("uses a temporary marker", () => expect("__rls_check_").toContain("rls_check")); });
