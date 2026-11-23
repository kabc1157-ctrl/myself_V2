import Image from "next/image";

export default function Loading() {
  return <main aria-label="이음새를 불러오는 중" aria-live="polite" className="v2-launch-splash" role="status">
    <Image src="/app-icon.png" alt="" width={148} height={148} priority />
    <div><strong>이음새</strong><span>IEUMSAE</span></div>
    <p>흩어진 기록 사이, 나를 발견하다.</p>
  </main>;
}
