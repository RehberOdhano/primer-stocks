-- Primer Stocks initial schema.
-- Tables split into two trust tiers:
--   1. Market data (tickers, price_snapshots, terms): world-readable,
--      writable only by the service-role key (price ingestion cron).
--   2. User data (portfolios, holdings, transactions): owner-only via RLS,
--      readable/writable only by the owning authenticated user.

-- ---------------------------------------------------------------------------
-- Market data
-- ---------------------------------------------------------------------------

create table tickers (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  market text not null check (market in ('US', 'PSX')),
  sector text,
  created_at timestamptz not null default now()
);

create table price_snapshots (
  id uuid primary key default gen_random_uuid(),
  ticker_id uuid not null references tickers (id) on delete cascade,
  snapshot_date date not null,
  open numeric,
  close numeric not null,
  volume bigint,
  pe_ratio numeric,
  market_cap numeric,
  week52_high numeric,
  week52_low numeric,
  source text not null check (source in ('finnhub', 'psx_portal')),
  created_at timestamptz not null default now(),
  unique (ticker_id, snapshot_date)
);

create index price_snapshots_ticker_date_idx
  on price_snapshots (ticker_id, snapshot_date desc);

create table terms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  explainer text not null,
  created_at timestamptz not null default now()
);

alter table tickers enable row level security;
alter table price_snapshots enable row level security;
alter table terms enable row level security;

create policy "tickers are publicly readable"
  on tickers for select
  to anon, authenticated
  using (true);

create policy "price_snapshots are publicly readable"
  on price_snapshots for select
  to anon, authenticated
  using (true);

create policy "terms are publicly readable"
  on terms for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies for anon/authenticated: writes to these
-- three tables only happen via the service-role key (RLS is bypassed by
-- service-role, so no policy is needed for the ingestion job).

-- ---------------------------------------------------------------------------
-- User data (paper trading)
-- ---------------------------------------------------------------------------

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  cash_balance numeric not null default 100000 check (cash_balance >= 0),
  created_at timestamptz not null default now()
);

create table holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios (id) on delete cascade,
  ticker_id uuid not null references tickers (id),
  quantity numeric not null default 0 check (quantity >= 0),
  avg_cost numeric not null default 0 check (avg_cost >= 0),
  unique (portfolio_id, ticker_id)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios (id) on delete cascade,
  ticker_id uuid not null references tickers (id),
  side text not null check (side in ('buy', 'sell')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price > 0),
  executed_at timestamptz not null default now()
);

create index holdings_portfolio_idx on holdings (portfolio_id);
create index transactions_portfolio_idx on transactions (portfolio_id, executed_at desc);

alter table portfolios enable row level security;
alter table holdings enable row level security;
alter table transactions enable row level security;

create policy "users manage their own portfolio"
  on portfolios for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "users manage their own holdings"
  on holdings for all
  to authenticated
  using (
    portfolio_id in (
      select id from portfolios where user_id = (select auth.uid())
    )
  )
  with check (
    portfolio_id in (
      select id from portfolios where user_id = (select auth.uid())
    )
  );

create policy "users manage their own transactions"
  on transactions for all
  to authenticated
  using (
    portfolio_id in (
      select id from portfolios where user_id = (select auth.uid())
    )
  )
  with check (
    portfolio_id in (
      select id from portfolios where user_id = (select auth.uid())
    )
  );
