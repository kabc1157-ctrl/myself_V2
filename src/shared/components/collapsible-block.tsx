"use client";

import { useState } from "react";

export function CollapsibleBlock({ title, children, defaultOpen = false, alwaysOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean; alwaysOpen?: boolean }) {
  const [open, setOpen] = useState(alwaysOpen || defaultOpen);
  return <section className="rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="flex min-h-16 items-center justify-between gap-4 px-4 py-4 sm:px-6"><h2 className="text-base font-semibold text-stone-800">{title}</h2>{!alwaysOpen ? <button type="button" aria-expanded={open} aria-label={`${title} ${open ? "접기" : "펼치기"}`} onClick={() => setOpen((value) => !value)} className="rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-stone-100">{open ? "접기" : "펼치기"}</button> : null}</div>{open ? <div className="border-t border-stone-100 px-4 py-4 sm:px-6">{children}</div> : null}</section>;
}
