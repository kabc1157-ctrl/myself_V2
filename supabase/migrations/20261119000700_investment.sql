create table if not exists public.investment_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market text not null default 'unknown',
  symbol text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, market, symbol),
  unique (id, user_id)
);
create table if not exists public.investment_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null,
  trade_date date not null,
  side text not null check (side in ('buy','sell')),
  quantity numeric(24,8) not null check (quantity > 0),
  unit_price numeric(24,8) not null check (unit_price >= 0),
  total_amount numeric(32,8) generated always as (quantity * unit_price) stored,
  stop_loss_amount numeric(32,8),
  reason text not null default '',
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint investment_trade_asset_owner foreign key (asset_id,user_id) references public.investment_assets(id,user_id) on delete cascade
);
create index if not exists investment_trades_user_date on public.investment_trades(user_id,trade_date desc,created_at desc);
alter table public.investment_assets enable row level security;
alter table public.investment_trades enable row level security;
drop policy if exists investment_assets_select_own on public.investment_assets;
drop policy if exists investment_assets_insert_own on public.investment_assets;
drop policy if exists investment_assets_update_own on public.investment_assets;
drop policy if exists investment_assets_delete_own on public.investment_assets;
drop policy if exists investment_trades_select_own on public.investment_trades;
drop policy if exists investment_trades_insert_own on public.investment_trades;
drop policy if exists investment_trades_update_own on public.investment_trades;
drop policy if exists investment_trades_delete_own on public.investment_trades;
create policy investment_assets_select_own on public.investment_assets for select to authenticated using ((select auth.uid())=user_id);
create policy investment_assets_insert_own on public.investment_assets for insert to authenticated with check ((select auth.uid())=user_id);
create policy investment_assets_update_own on public.investment_assets for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy investment_assets_delete_own on public.investment_assets for delete to authenticated using ((select auth.uid())=user_id);
create policy investment_trades_select_own on public.investment_trades for select to authenticated using ((select auth.uid())=user_id);
create policy investment_trades_insert_own on public.investment_trades for insert to authenticated with check ((select auth.uid())=user_id);
create policy investment_trades_update_own on public.investment_trades for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy investment_trades_delete_own on public.investment_trades for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.investment_assets,public.investment_trades to authenticated;
revoke all on public.investment_assets,public.investment_trades from anon;
