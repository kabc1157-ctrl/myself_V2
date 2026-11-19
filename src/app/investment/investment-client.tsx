"use client";
import{useMemo,useState}from'react';
import Link from'next/link';
import{useRouter}from'next/navigation';
import{ChartNoAxesCombined}from'lucide-react';
import{ActivityCalendar,CollapsibleRecordCard,RecordItem,RecordPageHeader}from'@/shared/components/record-kit';
import{deleteInvestmentAsset,deleteInvestmentTrade,saveInvestmentAsset,saveInvestmentTrade}from'@/core/investment-actions';
import{EditDeleteActions}from'@/shared/components/edit-delete-actions';
import{calculatePosition}from'@/core/investment-math';
import{useToast}from'@/shared/components/toast-provider';
type Asset={id:string;market:string;symbol:string;name:string};type Trade={id:string;asset_id:string;trade_date:string;side:'buy'|'sell';quantity:number;unit_price:number;total_amount:number;stop_loss_amount:number|null;reason:string;memo:string;created_at:string;updated_at:string};function calculateRealized(trades:Trade[],matches:(trade:Trade)=>boolean){const state=new Map<string,{quantity:number;average:number}>();let profit=0;let cost=0;for(const trade of [...trades].sort((a,b)=>a.trade_date.localeCompare(b.trade_date)||a.created_at.localeCompare(b.created_at))){const current=state.get(trade.asset_id)??{quantity:0,average:0};if(trade.side==='buy'){const quantity=current.quantity+Number(trade.quantity);current.average=quantity?((current.quantity*current.average)+(Number(trade.quantity)*Number(trade.unit_price)))/quantity:0;current.quantity=quantity;}else{const sold=Math.min(current.quantity,Number(trade.quantity));
const basis=sold*current.average;if(matches(trade)){profit+=(Number(trade.unit_price)*sold)-basis;cost+=basis;}current.quantity=Math.max(0,current.quantity-Number(trade.quantity));if(current.quantity===0)current.average=0;}state.set(trade.asset_id,current);}return{profit,rate:cost?profit/cost*100:null};}
export function InvestmentClient({assets,trades,date,month,today,weekStartsOn}:{assets:Asset[];trades:Trade[];date:string;month:string;today:string;weekStartsOn:'monday'|'sunday'}){const r=useRouter();
const{showToast}=useToast();
const[editing,setEditing]=useState<Trade|null>(null);
const[detail,setDetail]=useState<string|null>(null);
const[open,setOpen]=useState(false);
const[holdingsOpen,setHoldingsOpen]=useState(false);
const[assetOpen,setAssetOpen]=useState(false);
const[assetListOpen,setAssetListOpen]=useState(false);
const[editingAsset,setEditingAsset]=useState<Asset|null>(null);
const[assetBusy,setAssetBusy]=useState(false);
const[assetForm,setAssetForm]=useState({market:'KR',symbol:'',name:''});
const[busy,setBusy]=useState(false);
const[assetFilter,setAssetFilter]=useState('all');
const[reportYear,setReportYear]=useState(date.slice(0,4));
const[reportMonth,setReportMonth]=useState(date.slice(0,7));
const[form,setForm]=useState({assetId:assets[0]?.id??'',tradeDate:date,side:'buy' as 'buy'|'sell',quantity:'',unitPrice:'',stopLossAmount:'',reason:'',memo:''});
const run=async(work:()=>Promise<{ok:boolean;error?:string}>,msg:string,done?:()=>void)=>{setBusy(true);
const x=await work();setBusy(false);if(!x.ok){showToast(x.error??'처리하지 못했어요.','error');return;}done?.();showToast(msg,'success');r.refresh()};
const saveAsset=async()=>{setAssetBusy(true);const x=await saveInvestmentAsset({...assetForm,id:editingAsset?.id});setAssetBusy(false);if(!x.ok){showToast(x.error??'종목을 저장하지 못했어요.','error');return;}setAssetForm({market:'KR',symbol:'',name:''});setAssetOpen(false);setEditingAsset(null);showToast(editingAsset?'종목을 수정했어요.':'종목을 추가했어요.','success');r.refresh()};
const startAssetEdit=(asset:Asset)=>{setEditingAsset(asset);setAssetForm({market:asset.market,symbol:asset.symbol??'',name:asset.name});setAssetListOpen(true)};
const removeAsset=(asset:Asset)=>{if(window.confirm('이 종목을 삭제할까요?'))run(()=>deleteInvestmentAsset(asset.id),'종목을 삭제했어요.')};
const filtered=assetFilter==='all'?trades:trades.filter(t=>t.asset_id===assetFilter);
const selected=filtered.filter(t=>t.trade_date===date);
const values=useMemo(()=>Array.from(new Set(filtered.map(t=>t.trade_date))).map(d=>{const x=filtered.filter(t=>t.trade_date===d);
const buy=x.some(t=>t.side==='buy'),sell=x.some(t=>t.side==='sell');return{date:d,label:buy&&sell?'🟡🔵':buy?'🟡':'🔵'};}),[filtered]);
const yearlyRealized=useMemo(()=>calculateRealized(trades,t=>t.trade_date.startsWith(reportYear+'-')),[trades,reportYear]);
const monthlyRealized=useMemo(()=>calculateRealized(trades,t=>t.trade_date.startsWith(reportMonth)),[trades,reportMonth]);
const positions=useMemo(()=>assets.map(a=>({asset:a,position:calculatePosition(trades.filter(t=>t.asset_id===a.id))})),[assets,trades]);
const startEdit=(t:Trade)=>{setEditing(t);setOpen(true);setForm({assetId:t.asset_id,tradeDate:t.trade_date,side:t.side,quantity:String(t.quantity),unitPrice:String(t.unit_price),stopLossAmount:t.stop_loss_amount?String(t.stop_loss_amount):'',reason:t.reason,memo:t.memo})};
const selectDate=(d:string)=>{r.push(`/investment?date=${d}`,{scroll:false});setForm(v=>({...v,tradeDate:d}));};return <div className="rk-page investment-page">
<RecordPageHeader eyebrow="기록 ・ 매매일지" title="오늘의 투자" action={<Link className="investment-market-icon" href="/investment/market" aria-label="시장 정보" title="시장 정보">
<ChartNoAxesCombined size={24}/>
</Link>}/>
<section className="investment-performance">
<article>
<div className="investment-period-select">
<select aria-label="수익률 연도" value={reportYear} onChange={e=>{const y=e.target.value;setReportYear(y);setReportMonth(`${y}-${reportMonth.slice(5)}`)}}>{Array.from(new Set([date.slice(0,4),...trades.map(t=>t.trade_date.slice(0,4))])).sort().map(y=>
<option key={y} value={y}>{y}년</option>)}</select>
<span>적용</span>
</div>
<strong className={yearlyRealized.profit>=0?"is-positive":"is-negative"}>{yearlyRealized.rate===null?"-":`${yearlyRealized.profit>=0?"+":""}${yearlyRealized.rate.toFixed(1)}%`}</strong>
<small>수익 금액 {Math.round(yearlyRealized.profit).toLocaleString()}원</small>
</article>
<article>
<div className="investment-period-select">
<select aria-label="수익률 연도와 월" value={reportMonth} onChange={e=>setReportMonth(e.target.value)}>{Array.from({length:12},(_,i)=>`${reportYear}-${String(i+1).padStart(2,"0")}`).map(m=>
<option key={m} value={m}>{m.slice(2)}</option>)}</select>
<span>적용</span>
</div>
<strong className={monthlyRealized.profit>=0?"is-positive":"is-negative"}>{monthlyRealized.rate===null?"-":`${monthlyRealized.profit>=0?"+":""}${monthlyRealized.rate.toFixed(1)}%`}</strong>
<small>수익 금액 {Math.round(monthlyRealized.profit).toLocaleString()}원</small>
</article>
</section>
<CollapsibleRecordCard title="현재 보유 종목" open={holdingsOpen} onOpenChange={setHoldingsOpen}>
<div className="investment-holdings">{positions.filter(x=>x.position.quantity>0).map(x=>
<RecordItem key={x.asset.id}>
<strong>{x.asset.name}</strong>
<span>{x.position.quantity}주 · 평균 {x.position.averagePrice.toLocaleString()}</span>
<small>현재가 미확인 · 평가손익 미확인</small>
</RecordItem>)}{!positions.some(x=>x.position.quantity>0)?<p className="rk-empty">보유 중인 종목이 없어요.</p>:null}</div>
</CollapsibleRecordCard>
<CollapsibleRecordCard title="종목 추가" open={assetOpen} onOpenChange={v=>{setAssetOpen(v);if(!v)setEditingAsset(null)}}><div className="rk-form investment-asset-form"><label>종목명<input required value={assetForm.name} onChange={e=>setAssetForm({...assetForm,name:e.target.value})}/></label><label>종목 코드 (선택)<input value={assetForm.symbol} onChange={e=>setAssetForm({...assetForm,symbol:e.target.value})}/></label><div className="rk-actions"><button type="button" className="rk-button primary" disabled={assetBusy||!assetForm.name.trim()} onClick={saveAsset}>저장</button><button type="button" className="rk-button secondary" onClick={()=>{setAssetOpen(false);setEditingAsset(null)}}>취소</button></div></div></CollapsibleRecordCard>
<CollapsibleRecordCard title={editing?'매매일지 수정':'매매일지 쓰기'} open={open} onOpenChange={v=>setOpen(v)}>
<div className="rk-form">
<label>날짜<input type="date" value={form.tradeDate} max={today} onChange={e=>setForm({...form,tradeDate:e.target.value})}/>
</label>
<label>종목<select value={form.assetId} onChange={e=>setForm({...form,assetId:e.target.value})}>{assets.map(a=>
<option key={a.id} value={a.id}>{a.name} · {a.symbol}</option>)}</select>
</label>
<label>구분<select value={form.side} onChange={e=>setForm({...form,side:e.target.value as 'buy'|'sell'})}>
<option value="buy">매수</option>
<option value="sell">매도</option>
</select>
</label>
<label>수량<input type="number" min="0" step="any" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/>
</label>
<label>1주당 단가<input type="number" min="0" step="any" value={form.unitPrice} onChange={e=>setForm({...form,unitPrice:e.target.value})}/>
</label>
<p>총 거래금액 {((Number(form.quantity)||0)*(Number(form.unitPrice)||0)).toLocaleString()}</p>
<label>손절매 금액<input type="number" value={form.stopLossAmount} onChange={e=>setForm({...form,stopLossAmount:e.target.value})}/>
</label>
<label>매수/매도 이유<textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/>
</label>
<label>메모<textarea value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})}/>
</label>
<button className="rk-button primary" disabled={busy||!form.assetId} onClick={()=>run(()=>saveInvestmentTrade({...form,id:editing?.id}),'매매일지를 저장했어요.',()=>{setEditing(null);setOpen(false)})}>{editing?'수정 완료':'저장'}</button>
</div>
</CollapsibleRecordCard>
<ActivityCalendar month={month} selectedDate={date} values={values} onDateSelect={selectDate} onMonthChange={m=>r.push(`/investment?date=${m}-01`,{scroll:false})} title="투자 기록" maxDate={today} weekStartsOn={weekStartsOn} headerExtra={<select aria-label="종목 선택" value={assetFilter} onChange={e=>setAssetFilter(e.target.value)}>
<option value="all">전체 종목</option>{assets.map(a=>
<option key={a.id} value={a.id}>{a.name}</option>)}</select>}/>
<section className="investment-detail">
<h2 className="rk-section-title">{date} 거래 기록</h2>{selected.length?selected.map(t=>
<TradeRow key={t.id} trade={t} asset={assets.find(a=>a.id===t.asset_id)} detail={detail===t.id} onDetail={()=>setDetail(detail===t.id?null:t.id)} onEdit={()=>startEdit(t)} onDelete={()=>{if(window.confirm('이 거래를 삭제할까요?'))run(()=>deleteInvestmentTrade(t.id),'매매일지를 삭제했어요.')}}/>):<p className="rk-empty">이 날짜의 거래가 없어요.</p>}</section>
<CollapsibleRecordCard title="종목 리스트" open={assetListOpen} onOpenChange={setAssetListOpen}><div className="investment-asset-list">{assets.length?assets.map(asset=><RecordItem key={asset.id}><div className="investment-asset-row"><div><strong>{asset.name}</strong>{asset.symbol?<span>{asset.symbol}</span>:null}</div><EditDeleteActions onEdit={()=>startAssetEdit(asset)} onDelete={()=>removeAsset(asset)}/></div>{editingAsset?.id===asset.id?<div className="rk-inline-editor investment-asset-edit"><label>종목명<input value={assetForm.name} onChange={e=>setAssetForm({...assetForm,name:e.target.value})}/></label><label>종목 코드 (선택)<input value={assetForm.symbol} onChange={e=>setAssetForm({...assetForm,symbol:e.target.value})}/></label><div className="rk-actions"><button type="button" className="rk-button primary" disabled={assetBusy||!assetForm.name.trim()} onClick={saveAsset}>수정 완료</button><button type="button" className="rk-button secondary" onClick={()=>{setEditingAsset(null);setAssetForm({market:'KR',symbol:'',name:''})}}>취소</button></div></div>:null}</RecordItem>):<p className="rk-empty">등록된 종목이 없어요.</p>}</div></CollapsibleRecordCard>
</div>}
function TradeRow({trade,asset,detail,onDetail,onEdit,onDelete}:{trade:Trade;asset?:Asset;detail:boolean;onDetail:()=>void;onEdit:()=>void;onDelete:()=>void}){return <RecordItem>
<button type="button" className="investment-trade-summary" onClick={onDetail}>
<strong>{trade.side==='buy'?'매수':'매도'} · {asset?.name??'종목'}</strong>
<span>{trade.quantity}주 · {trade.unit_price.toLocaleString()}원 · {Number(trade.total_amount).toLocaleString()}원</span>
</button>{detail?<div className="investment-trade-detail">
<p className="rk-original-text">손절매 금액: {trade.stop_loss_amount??'없음'}<br/>이유: {trade.reason||'없음'}<br/>메모: {trade.memo||'없음'}</p>
<div className="rk-actions">
<button className="rk-button secondary" onClick={onEdit}>수정</button>
<button className="rk-button danger" onClick={onDelete}>삭제</button>
</div>
</div>:null}</RecordItem>}
