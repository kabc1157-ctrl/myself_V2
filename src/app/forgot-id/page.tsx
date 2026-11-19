import Link from "next/link";
import { AuthLayout } from "@/shared/components/auth-layout";
export default function ForgotIdPage(){return <AuthLayout title="로그인 이메일 찾기" description="이음새는 별도 아이디 없이 가입 이메일로 로그인합니다."><div className="mt-6 space-y-4 text-sm leading-6 text-stone-600"><p>가입 이메일을 확인할 수 없다면 개인정보 보호를 위해 계정 검색 결과를 제공하지 않습니다.</p><p>가입 당시 사용한 이메일의 메일함을 확인하거나 고객지원의 확인 가능한 복구 절차를 이용해 주세요.</p><Link className="block text-center underline" href="/auth/login">로그인으로 돌아가기</Link></div></AuthLayout>}
