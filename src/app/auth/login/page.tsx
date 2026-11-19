import { LoginForm } from "@/app/auth/auth-forms";
import { AuthLayout } from "@/shared/components/auth-layout";

export default function Login() { return <AuthLayout title="다시 이어갈 시간이에요" description="이음새에 로그인하고 오늘의 기록을 이어가세요."><LoginForm /></AuthLayout>; }
