import { describe, expect, it } from "vitest";
import { toKoreanAuthError } from "./error-message";

describe("Korean auth error messages", () => {
  it("maps Supabase email rate limits to a retry message", () => {
    expect(toKoreanAuthError({ code: "over_email_send_rate_limit", message: "email rate limit exceeded", status: 429 })).toContain("보안을 위해 잠시 후 다시 시도해 주세요.");
  });
  it("translates rate limits and includes retry seconds", () => {
    expect(toKoreanAuthError({ status: 429, message: "retry after 30 seconds" })).toContain("약 30초");
  });
  it("translates invalid credentials", () => {
    expect(toKoreanAuthError({ message: "Invalid login credentials" })).toContain("이메일 또는 비밀번호");
  });
  it("does not expose provider error text", () => {
    expect(toKoreanAuthError({ message: "unexpected provider secret" })).not.toContain("provider secret");
  });
});
