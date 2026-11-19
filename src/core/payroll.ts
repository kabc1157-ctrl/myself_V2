export type PayType = "hourly" | "daily" | "per_task" | "bonus";
export const payTypeLabels: Record<PayType, string> = { hourly: "시급", daily: "일급", per_task: "건별", bonus: "상여" };
type Shift = { start_time: string | null; end_time: string | null; break_minutes: number; pay_type: PayType; pay_rate: number; quantity: number; additional_pay: number };
export function workedMinutes(shift: Pick<Shift,"start_time"|"end_time"|"break_minutes">) { if (!shift.start_time || !shift.end_time) return null; const toMin=(v:string)=>{const [h,m]=v.slice(0,5).split(":").map(Number);return h*60+m}; let end=toMin(shift.end_time); const start=toMin(shift.start_time); if(end<start) end+=1440; return Math.max(0,end-start-shift.break_minutes); }
export function calculatePay(shift: Shift) { const base=shift.pay_type === "hourly" ? ((workedMinutes(shift) ?? 0)/60)*shift.pay_rate*shift.quantity : shift.pay_rate*shift.quantity; return Math.round(base+shift.additional_pay); }
export const formatWon=(amount:number)=>`${new Intl.NumberFormat("ko-KR").format(Math.round(amount))}원`;
