export type AuthActionState = { error?: string; message?: string };

function retrySeconds(message: string) {
  const match = message.match(/(?:after|in|retry(?: after)?)[^0-9]{0,12}(\d+)\s*(?:seconds?|초)/i);
  return match?.[1];
}

export function toKoreanAuthError(error: { message?: string; status?: number; code?: string }): string {
  const raw = error.message ?? "";
  const retry = retrySeconds(raw);
  if (error.status === 429 || /over_email_send_rate_limit|rate limit|too many|captcha/i.test(`${error.code ?? ""} ${raw}`)) {
    return `보안을 위해 잠시 후 다시 시도해 주세요.${retry ? ` 약 ${retry}초 후 재시도할 수 있어요.` : ""}`;
  }
  if (/invalid login credentials|invalid credentials/i.test(raw)) return "이메일 또는 비밀번호를 다시 확인해 주세요.";
  if (/auth session missing|session.*missing|session.*expired/i.test(raw)) return "재설정 링크가 만료되었거나 유효하지 않습니다. 새 재설정 메일을 요청해 주세요.";
  if (/email not confirmed/i.test(raw)) return "이메일 인증을 완료한 뒤 로그인해 주세요.";
  if (/user already registered|already been registered/i.test(raw)) return "이미 가입된 이메일입니다. 로그인하거나 비밀번호를 재설정해 주세요.";
  if (/password.*(short|characters|length)|weak password|at least 8/i.test(raw)) return "비밀번호는 8자 이상으로 설정해 주세요.";
  if (/same password|different password/i.test(raw)) return "이전 비밀번호와 다른 비밀번호를 입력해 주세요.";
  if (/invalid email/i.test(raw)) return "올바른 이메일 주소를 입력해 주세요.";
  if (/expired|invalid.*(token|link)/i.test(raw)) return "인증 링크가 만료되었거나 유효하지 않습니다. 새 링크를 요청해 주세요.";
  return "요청을 처리하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.";
}
