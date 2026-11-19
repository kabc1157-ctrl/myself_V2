import Link from "next/link";

export function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#fffaf0] px-4 py-8 sm:px-6 sm:py-14"><div className="mx-auto w-full max-w-md"><Link href="/" className="inline-flex items-center gap-3" aria-label="이음새 홈"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#DDC49B] bg-[#FFEBC8] font-normal text-[#756A60] shadow-sm">이</span><span className="text-lg font-semibold tracking-wide text-stone-800">IEUMSAE</span></Link><section className="mt-8 rounded-3xl border border-[#f3dfbd] bg-white p-5 shadow-[0_18px_50px_rgba(121,85,35,0.10)] sm:mt-10 sm:p-8"><h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1><p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>{children}</section><p className="mt-6 text-center text-xs text-stone-400">기록에서 나를 찾다.</p></div></main>;
}
