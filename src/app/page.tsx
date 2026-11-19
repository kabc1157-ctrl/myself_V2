import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";

const records = [
  ["일기", "오늘의 감정과 경험"],
  ["루틴", "꾸준한 실천과 회고"],
  ["일정", "계획과 실제 하루의 흐름"],
  ["생활 기록", "운동·독서·메모·투자"],
];

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/home");

  return <main className="landing-page"><style>{` .landing-page{min-height:100vh;background:#f2e8dc;color:#586486}.landing-header{display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:auto;padding:20px 24px}.landing-brand{display:grid;color:#586486;text-decoration:none;line-height:1}.landing-brand strong{font-size:1.2rem}.landing-brand small{margin-top:4px;color:#7e7973;font-size:.5rem;letter-spacing:.25em}.landing-header nav,.landing-actions,.landing-footer nav{display:flex;align-items:center;gap:10px}.landing-header a,.landing-footer a{color:#586486;text-decoration:none;font-weight:700}.landing-header-cta,.landing-primary{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#ffbe46;color:#586486!important;padding:12px 18px}.landing-content{max-width:980px;margin:auto;padding:40px 24px}.landing-hero{padding:72px 0 110px}.landing-kicker{margin:0 0 16px;color:#7e7973;font-size:.72rem;font-weight:700;letter-spacing:.16em}.landing-hero h1{margin:0;font-size:clamp(2.45rem,7vw,5.2rem);line-height:1.12;letter-spacing:-.07em}.landing-hero h1 span{color:#586486}.landing-lede{margin:24px 0 30px;color:#7e7973;font-size:1.05rem;line-height:1.8}.landing-secondary{padding:12px 18px;color:#586486;text-decoration:none;font-weight:700}.landing-section{padding:70px 0}.landing-section h2,.landing-feature h2,.landing-final h2{margin:0;font-size:clamp(1.8rem,4vw,3.1rem);line-height:1.3;letter-spacing:-.06em}.landing-record-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:32px}.landing-record-grid article,.landing-feature,.landing-calendar-copy{border:1px solid rgb(88 100 134 / 12%);border-radius:24px;background:#fbf6ef;padding:24px}.landing-record-grid h3{margin:0 0 12px;font-size:1.15rem}.landing-record-grid p,.landing-feature p,.landing-calendar-copy p{margin:0;color:#7e7973;line-height:1.6}.landing-feature{display:flex;align-items:center;justify-content:space-between;gap:24px;background:#eaf3f8}.landing-feature>span{flex:none;border-radius:999px;background:#ffe3b3;padding:9px 13px;font-size:.8rem;font-weight:700}.landing-calendar-copy{margin:30px 0;background:#fff8ed}.landing-calendar-copy p{margin-top:18px;max-width:620px}.landing-final{padding:100px 0 80px}.landing-final .landing-primary{margin-top:28px}.landing-footer{display:flex;max-width:1120px;margin:auto;align-items:center;justify-content:space-between;gap:20px;padding:28px 24px;border-top:1px solid rgb(88 100 134 / 12%)}.landing-footer div{display:grid;gap:5px}.landing-footer span{color:#7e7973;font-size:.78rem}.landing-footer nav{flex-wrap:wrap;font-size:.78rem}@media(max-width:640px){.landing-header{padding:16px}.landing-header nav a:not(.landing-header-cta){display:none}.landing-content{padding:20px 18px}.landing-hero{padding:58px 0 76px}.landing-lede{font-size:.94rem}.desktop-only{display:none}.landing-record-grid{grid-template-columns:repeat(2,1fr)}.landing-record-grid article{padding:18px}.landing-feature{align-items:flex-start;flex-direction:column}.landing-footer{align-items:flex-start;flex-direction:column;padding-inline:18px}.landing-footer nav{gap:8px 14px}}`}</style>
    <style>{`.landing-header-cta,.landing-primary{border:1px solid #DDC49B;background:#FFEBC8;color:#756A60!important;font-weight:400}.landing-header-cta:hover,.landing-primary:hover{background:#f9dfb8}`}</style>
    <header className="landing-header"><Link href="/" className="landing-brand"><strong>이음새</strong><small>IEUMSAE</small></Link><nav><Link href="/auth/login">로그인</Link><Link className="landing-header-cta" href="/auth/signup">시작하기</Link></nav></header>
    <div className="landing-content">
      <section className="landing-hero"><p className="landing-kicker">RECORD · CONNECT · DISCOVER</p><h1>흩어진 기록 사이,<br/><span>나를 발견하다.</span></h1><p className="landing-lede">일기와 루틴, 일정과 생활의 기록을 한곳에 모으세요.<br className="desktop-only"/> 쌓인 기록을 연결해 나의 변화와 패턴을 발견합니다.</p><div className="landing-actions"><Link className="landing-primary" href="/auth/signup">이음새 시작하기</Link><Link className="landing-secondary" href="/auth/login">이미 계정이 있어요</Link></div></section>
      <section className="landing-section"><p className="landing-kicker">YOUR RECORDS</p><h2>하루의 기록들이 모여,<br/>나를 점점 이해하게 돼요.</h2><div className="landing-record-grid">{records.map(([title, body])=><article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section className="landing-feature"><div><p className="landing-kicker">INSIGHT</p><h2>기록에서 발견하는<br/>나의 패턴</h2><p>일간·주간·월간 기록을 연결해 자기이해를 돕는 기능을 준비하고 있어요.</p></div><span>준비 중</span></section>
      <section className="landing-section landing-calendar-copy"><p className="landing-kicker">CONNECTED DAY</p><h2>기록과 오늘의 일정을<br/>자연스럽게 연결해요.</h2><p>Google Calendar를 연결하면 기록과 일정의 흐름을 한곳에서 살펴볼 수 있어요. 실제 연결 상태에 따라 이용할 수 있습니다.</p></section>
      <section className="landing-final"><h2>오늘의 나를 기록하는 일,<br/>지금 가볍게 시작해보세요.</h2><Link className="landing-primary" href="/auth/signup">이음새 시작하기</Link></section>
    </div>
    <footer className="landing-footer"><div><strong>이음새</strong><span>기록에서 나를 찾다.</span></div><nav><Link href="/privacy">개인정보처리방침</Link><Link href="/terms">서비스 이용약관</Link><Link href="/auth/login">로그인</Link></nav></footer>
  </main>;
}
