"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function LaunchPage() {
  const router = useRouter();
  useEffect(() => {
    router.prefetch("/home");
    let cancelled = false;
    const navigate = async () => {
      try { await fetch("/home", { cache: "no-store", credentials: "include" }); } catch { /* navigation remains the fallback */ }
      if (!cancelled) router.replace("/home");
    };
    void navigate();
    return () => { cancelled = true; };
  }, [router]);
  return <main aria-label="이음새를 불러오는 중" aria-live="polite" className="v2-launch-splash" role="status"><Image src="/app-icon.png" alt="" width={148} height={148} priority /><div><strong>이음새</strong><span>IEUMSAE</span></div><p>흩어진 기록 사이, 나를 발견하다.</p></main>;
}
