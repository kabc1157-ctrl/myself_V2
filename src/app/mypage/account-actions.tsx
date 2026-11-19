"use client";
import Link from "next/link";
import { signOut } from "@/core/auth/actions";
export function AccountActions() { return <details className="mypage-collapsible mypage-danger-zone"><summary>계정 및 로그아웃</summary><div className="account-actions-body"><form action={signOut}><button className="rk-button secondary" type="submit">로그아웃</button></form><nav className="legal-links"><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">서비스 이용약관</Link></nav><section className="account-delete-confirm"><h3>계정 탈퇴</h3><p>프로필과 이음새에 저장한 기록이 삭제되며 복구할 수 없습니다. Google Calendar의 원본 일정은 삭제하지 않습니다.</p><p className="record-muted">안전한 재인증·스토리지 정리·부분 실패 처리가 확인된 후 활성화됩니다.</p><button className="rk-button danger" type="button" disabled>계정 탈퇴 준비 중</button></section></div></details>; }
