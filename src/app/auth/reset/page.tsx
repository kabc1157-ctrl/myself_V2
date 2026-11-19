import { ResetForm } from "@/app/auth/auth-forms";
import { AuthLayout } from "@/shared/components/auth-layout";

export default async function Reset({ searchParams }: { searchParams: Promise<{ link?: string }> }) { const params = await searchParams; return <AuthLayout title="비밀번호 재설정" description="가입한 이메일로 재설정 메일을 보내거나 새 비밀번호를 저장하세요."><ResetForm initialError={params.link} /></AuthLayout>; }
