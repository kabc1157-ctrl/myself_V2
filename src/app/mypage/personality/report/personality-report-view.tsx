import type { PersonalityReportV2 } from "@/core/personality/report-v2";

type Insight = PersonalityReportV2["sections"]["behavior"]["items"][number];
const BAND = {low: "동의 낮음", mixed: "응답 혼합", high: "동의 높음"} as const;

function Section({number, title, children}: {number: number; title: string; children: React.ReactNode}) {
  return <section className="rounded-[1.5rem] border border-[#e3d8c8] bg-[#faf4ea] p-5 sm:p-7">
    <p className="text-sm font-semibold text-[#9a7540]">{String(number).padStart(2, "0")}</p>
    <h2 className="mt-1 text-xl font-bold text-[#59688a] sm:text-2xl">{title}</h2>{children}
  </section>;
}
function Evidence({items}: {items: Insight["evidence"]}) {
  return <div className="mt-3 flex flex-wrap gap-2">{items.map(item =>
    <span key={item.dimension} className="rounded-full border border-[#e3d8c8] bg-[#fffaf3] px-3 py-1.5 text-xs text-[#59688a]">
      {item.label} {item.score}점 · {BAND[item.band as keyof typeof BAND]}
    </span>)}</div>;
}
function InsightCards({items}: {items: Insight[]}) {
  return <div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(item =>
    <article key={item.title} className="rounded-2xl border border-[#e3d8c8] bg-[#fffaf3] p-4 sm:p-5">
      <h3 className="font-bold text-[#59688a]">{item.title}</h3>
      <Evidence items={item.evidence}/>
      <p className="mt-4 text-sm leading-7 text-[#514c45]">{item.meaning}</p>
      <p className="mt-3 rounded-xl bg-[#f2e5ce] p-3 text-sm leading-6 text-[#644b2c]">{item.action}</p>
    </article>)}</div>;
}

export function PersonalityReportView({report, completedAt}: {report: PersonalityReportV2; completedAt: string | null}) {
  const {summary, behavior, personality, motivationExecution, connections, strengths, strategies} = report.sections;
  const date = completedAt && !Number.isNaN(Date.parse(completedAt)) ?
    new Intl.DateTimeFormat("ko-KR", {year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul"}).format(new Date(completedAt)) : null;
  return <div className="space-y-5 text-[#28231f]">
    <header className="rounded-[1.5rem] border border-[#e3d8c8] bg-[#f8ebd7] p-6 sm:p-8">
      <p className="text-sm font-semibold text-[#9a7540]">IEUMSAE · SELF DISCOVERY</p>
      <h1 className="mt-3 text-2xl font-bold leading-snug text-[#59688a] sm:text-3xl">{report.headline}</h1>
      <p className="mt-3 text-sm text-[#776f67]">{date ? `${date} 완료` : "검사 완료"} · 최초 결과 · 재검사 불가</p>
    </header>
    <Section number={1} title={summary.title}>
      <p className="mt-4 text-base leading-8">{summary.text}</p><Evidence items={summary.evidence}/>
      <p className="mt-4 rounded-xl bg-[#f2e5ce] p-4 font-semibold leading-7 text-[#644b2c]">{summary.strategy}</p>
    </Section>
    <Section number={2} title={behavior.title}><InsightCards items={behavior.items}/></Section>
    <Section number={3} title={personality.title}><InsightCards items={personality.items}/></Section>
    <Section number={4} title={motivationExecution.title}>
      <InsightCards items={motivationExecution.items}/>
      <p className="mt-4 rounded-xl bg-[#f2e5ce] p-4 text-sm leading-7">{motivationExecution.synthesis}</p>
    </Section>
    <Section number={5} title={connections.title}>
      <div className="mt-5 space-y-3">{connections.items.map(item =>
        <article key={item.id} className="rounded-2xl border border-[#e3d8c8] bg-[#fffaf3] p-4 sm:p-5">
          <h3 className="font-bold text-[#59688a]">{item.title}</h3>
          <p className="mt-2 text-sm leading-7">{item.analysis}</p>
          <p className="mt-2 text-sm leading-7 text-[#8b682c]">{item.strategy}</p>
        </article>)}</div>
      <p className="mt-4 text-sm leading-7 text-[#776f67]">{connections.note}</p>
    </Section>
    <Section number={6} title={strengths.title}>
      {strengths.items.length ? <InsightCards items={strengths.items}/> :
        <p className="mt-4 text-sm leading-7">이번 응답에서는 일관된 단일 특징을 충분히 확인하기 어려워 강점과 주의점을 억지로 제시하지 않았어요.</p>}
    </Section>
    <Section number={7} title={strategies.title}>
      <InsightCards items={strategies.items}/>
      <p className="mt-4 text-xs leading-6 text-[#776f67]">{strategies.note}</p>
    </Section>
    <p className="px-2 text-xs leading-6 text-[#776f67]">{report.disclaimer}</p>
  </div>;
}
