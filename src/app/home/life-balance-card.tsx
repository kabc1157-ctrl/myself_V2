"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChartNoAxesColumnIncreasing } from "lucide-react";
import {
  LIFE_AREAS, LIFE_AREA_LABELS, LIFE_AREA_COLORS, LIFE_BALANCE_PERIODS,
  emptyLifeBalance, type LifeBalanceCounts, type LifeBalancePeriod,
} from "@/core/life-balance";
import { getLifeBalancePeriod, type LifeBalanceResponse } from "@/core/life-balance-actions";
import "./life-balance-card.css";

export function LifeBalanceCard({ initial }: { initial: LifeBalanceResponse }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<LifeBalancePeriod>("7d");
  const [counts, setCounts] = useState<LifeBalanceCounts>(initial.counts);
  const [error, setError] = useState(initial.ok ? "" : initial.error);
  const [pending, start] = useTransition();
  const max = Math.max(1, ...LIFE_AREAS.map((area) => counts[area]));
  const periodLabel = LIFE_BALANCE_PERIODS.find((item) => item.value === period)?.label ?? "최근 7일";
  function choosePeriod(next: LifeBalancePeriod) {
    if (next === period) return;
    setPeriod(next);
    setError("");
    start(async () => {
      const response = await getLifeBalancePeriod(next);
      if (response.ok) setCounts(response.counts);
      else setError(response.error);
    });
  }
  return (
    <section className="life-balance-card" aria-label="나의 삶 밸런스">
      <button type="button" className="life-balance-heading" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="life-balance-heading-title"><ChartNoAxesColumnIncreasing size={22} strokeWidth={2.5} aria-hidden="true" />나의 삶 밸런스</span>
        <span className="life-balance-heading-side">{!open && periodLabel}<ChevronDown size={19} className={open ? "is-open" : ""} aria-hidden="true" /></span>
      </button>
      {!open ? (
        <div className="life-balance-summary">
          {LIFE_AREAS.map((area) => (
            <div className="life-balance-summary-item" key={area}>
              <span className="life-balance-dot" style={{ background: LIFE_AREA_COLORS[area] }} aria-hidden="true" />
              <span>{LIFE_AREA_LABELS[area]}</span>
              <strong>{counts[area]}개</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="life-balance-expanded">
          <p className="life-balance-description">기록으로 본, 최근의 삶의 흐름이에요.</p>
          <div className="life-balance-filters" role="group" aria-label="집계 기간">
            {LIFE_BALANCE_PERIODS.map((item) => (
              <button type="button" key={item.value} disabled={pending} aria-pressed={period === item.value}
                className={period === item.value ? "selected" : ""} onClick={() => choosePeriod(item.value)}>{item.label}</button>
            ))}
          </div>
          {error ? <p className="life-balance-error" role="alert">{error}</p> : null}
          <div className="life-balance-plot" aria-label={periodLabel + " 영역별 완료 활동 개수"} aria-busy={pending}>
            <div className="life-balance-yaxis" aria-hidden="true"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div>
            <div className="life-balance-columns">
              {LIFE_AREAS.map((area) => (
                <div className="life-balance-column" key={area}>
                  <div className="life-balance-bar-zone">
                    <span className="life-balance-number">{counts[area]}</span>
                    <div className="life-balance-bar" role="img" aria-label={LIFE_AREA_LABELS[area] + " " + counts[area] + "개"}
                      style={{ height: counts[area] === 0 ? "0%" : Math.max(2, (counts[area] / max) * 100) + "%", background: LIFE_AREA_COLORS[area] }} />
                  </div>
                  <span className="life-balance-xlabel">{LIFE_AREA_LABELS[area]}</span>
                </div>
              ))}
            </div>
          </div>
          {pending ? <p className="life-balance-loading" role="status">집계 중…</p> : null}
        </div>
      )}
    </section>
  );
}
