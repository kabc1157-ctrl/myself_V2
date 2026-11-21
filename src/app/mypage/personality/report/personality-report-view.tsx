import type { PersonalityReport, PersonalityDimensionExplanation } from "@/core/personality/report";

const BAND = { low: "동의 낮음", mixed: "응답 혼합", high: "동의 높음" } as const;

function ScoreList({ dimensions }: { dimensions: PersonalityDimensionExplanation[] }) {
  return <div className="mt-4 space-y-3">{dimensions.map(item =>
    <article key={item.dimension} className="rounded-xl border bg-white p-4">
      <div className="flex justify-between gap-3"><h3 className="font-semibold">{item.label}</h3><span className="text-sm text-[#8B682C]">{item.score}점 · {BAND[item.band]}</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100" role="meter" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.score}>
        <div className="h-full bg-[#FFBE46]" style={{width: `${item.score}%`}} />
      </div>
      <p className="mt-3 text-sm leading-6">{item.summary}</p><p className="mt-2 text-sm leading-6 text-stone-600">{item.lifeMeaning}</p>
      {item.observation && <p className="mt-2 text-sm leading-6 text-[#AD634D]">{item.observation}</p>}
    </article>)}</div>;
}
function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-[#FFFDF9] p-5"><p className="text-xs text-[#8B682C]">{String(number).padStart(2,"0")}</p><h2 className="mt-1 text-lg font-semibold">{title}</h2>{children}</section>;
}

export function PersonalityReportView({report,completedAt}:{report:PersonalityReport; completedAt:string|null}) {
  const {summary,personality,motivation,execution,connections,strengthsAndWatchouts,strategies}=report.sections;
  const date=completedAt&&!Number.isNaN(Date.parse(completedAt))?new Intl.DateTimeFormat("ko-KR",{year:"numeric",month:"long",day:"numeric",timeZone:"Asia/Seoul"}).format(new Date(completedAt)):null;
  return <div className="space-y-4 text-stone-900">
    <header className="rounded-2xl bg-[#FFF3D8] p-6">
      <p className="text-xs tracking-wide text-[#88632A]">IEUMSAE · SELF DISCOVERY</p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug">{report.headline}</h1>
      <p className="mt-3 text-sm text-stone-600">{date ? `${date} 완료` : "검사 완료"} · 최초 결과 · 재검사 불가</p>
    </header>
    <Section number={1} title={summary.title}><p className="mt-3 text-sm leading-7">{summary.text}</p><div className="mt-4 flex flex-wrap gap-2">{summary.prominent.map(x=><span key={x.dimension} className="rounded-full bg-white px-3 py-2 text-xs">{x.label} {x.score}점</span>)}</div></Section>
    <Section number={2} title={personality.title}><ScoreList dimensions={personality.dimensions}/></Section>
    <Section number={3} title={motivation.title}><ScoreList dimensions={motivation.dimensions}/><p className="mt-4 rounded-xl bg-[#FFF4DE] p-4 text-sm leading-6">{motivation.interaction}</p></Section>
    <Section number={4} title={execution.title}><ScoreList dimensions={execution.dimensions}/><p className="mt-4 rounded-xl bg-[#FFF4DE] p-4 text-sm leading-6">{execution.observation}</p></Section>
    <Section number={5} title={connections.title}>
      {connections.items.length? <div className="mt-4 space-y-3">{connections.items.map(item=><article key={item.id} className="rounded-xl border bg-white p-4"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6">{item.analysis}</p><p className="mt-2 text-sm leading-6 text-[#8B682C]">{item.strategy}</p></article>)}</div>:<p className="mt-3 text-sm text-stone-600">이번 응답에는 해당하는 성향 조합이 없어요.</p>}
      <p className="mt-3 text-xs leading-5 text-stone-500">{connections.note}</p>
    </Section>
    <Section number={6} title={strengthsAndWatchouts.title}>
      <h3 className="mt-4 font-semibold">활용 가능한 강점</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{strengthsAndWatchouts.possibleStrengths.map((v,i)=><li key={i}>{v}</li>)}</ul>
      <h3 className="mt-5 font-semibold">관찰할 주의점</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6">{strengthsAndWatchouts.watchouts.map((v,i)=><li key={i}>{v}</li>)}</ul>
    </Section>
    <Section number={7} title={strategies.title}><div className="mt-4 space-y-3">{strategies.items.map(item=><article key={item.area} className="rounded-xl border bg-white p-4"><h3 className="font-semibold text-[#8B682C]">{item.title}</h3><p className="mt-2 text-sm leading-6">{item.action}</p></article>)}</div></Section>
    <p className="text-xs leading-6 text-stone-500">{report.disclaimer}</p>
  </div>;
}
