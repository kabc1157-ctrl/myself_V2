import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/core/supabase/server';
import {AppShell} from '@/shared/components/app-shell';
import {InvestmentClient} from './investment-client';

export default async function InvestmentPage({searchParams}:{searchParams:Promise<{date?:string}>}){
  const s=await createSupabaseServerClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect('/auth/login');
  const p=await searchParams;const today=new Date().toISOString().slice(0,10);const date=p.date??today;const month=date.slice(0,7);
  const[{data:assets},{data:trades},{data:profile}]=await Promise.all([
    s.from('investment_assets').select('id,market,symbol,name').eq('user_id',user.id).order('name'),
    s.from('investment_trades').select('id,asset_id,trade_date,side,quantity,unit_price,total_amount,stop_loss_amount,reason,memo,created_at,updated_at').eq('user_id',user.id).order('trade_date',{ascending:false}).order('created_at',{ascending:false}),
    s.from('profiles').select('week_starts_on').eq('id',user.id).maybeSingle()
  ]);
  return <AppShell><InvestmentClient assets={assets??[]} trades={trades??[]} date={date} month={month} today={today} weekStartsOn={profile?.week_starts_on==='sunday'?'sunday':'monday'}/></AppShell>;
}
