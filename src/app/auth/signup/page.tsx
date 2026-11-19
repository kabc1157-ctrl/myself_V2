import { SignupForm } from "@/app/auth/auth-forms";
import { AuthLayout } from "@/shared/components/auth-layout";

export default function Signup() { return <AuthLayout title="새로운 이음새 만들기" description="나를 이해하는 기록을 차분히 시작해 보세요."><SignupForm /></AuthLayout>; }
