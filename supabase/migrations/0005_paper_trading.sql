-- Paper trading: split cash by currency, whole shares only, atomic trade
-- execution, auto-created portfolio on signup, and daily portfolio value
-- history for a future performance chart.

-- ---------------------------------------------------------------------------
-- Cash: two separate pools, no fake FX conversion between USD and PKR.
-- ---------------------------------------------------------------------------

alter table portfolios drop column cash_balance;
alter table portfolios
  add column cash_balance_usd numeric not null default 100000 check (cash_balance_usd >= 0),
  add column cash_balance_pkr numeric not null default 5000000 check (cash_balance_pkr >= 0);

-- ---------------------------------------------------------------------------
-- Whole shares only (both tables are empty so far — no data to migrate).
-- ---------------------------------------------------------------------------

alter table holdings alter column quantity type integer using quantity::integer;
alter table transactions alter column quantity type integer using quantity::integer;

-- ---------------------------------------------------------------------------
-- Portfolio value history, for a future performance-over-time chart.
-- Populated by the daily snapshot-portfolios cron, not by users directly.
-- ---------------------------------------------------------------------------

create table portfolio_value_snapshots (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references portfolios (id) on delete cascade,
  snapshot_date date not null,
  cash_usd numeric not null,
  cash_pkr numeric not null,
  holdings_value_usd numeric not null,
  holdings_value_pkr numeric not null,
  created_at timestamptz not null default now(),
  unique (portfolio_id, snapshot_date)
);

alter table portfolio_value_snapshots enable row level security;

create policy "users view their own portfolio value history"
  on portfolio_value_snapshots for select
  to authenticated
  using (
    portfolio_id in (
      select id from portfolios where user_id = (select auth.uid())
    )
  );

-- No insert/update policy: only the service-role cron writes these rows.

-- ---------------------------------------------------------------------------
-- Auto-create a portfolio when a user signs up.
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.portfolios (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic trade execution. SECURITY INVOKER (the default) so RLS still
-- applies inside the function body — it can only ever touch the calling
-- user's own portfolio, even if called directly via RPC. Market orders
-- only, filled at the latest stored price_snapshots.close (never a live
-- fetch, consistent with the rest of the app never calling a 3rd-party API
-- on a user request).
-- ---------------------------------------------------------------------------

create function public.execute_trade(
  p_symbol text,
  p_side text,
  p_quantity integer
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_portfolio_id uuid;
  v_ticker_id uuid;
  v_market text;
  v_price numeric;
  v_trade_value numeric;
  v_cash_usd numeric;
  v_cash_pkr numeric;
  v_held_qty integer;
  v_held_avg_cost numeric;
  v_new_avg_cost numeric;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_side not in ('buy', 'sell') then
    raise exception 'Invalid order side: %', p_side;
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be a positive whole number';
  end if;

  select id into v_portfolio_id from portfolios where user_id = v_user_id;
  if v_portfolio_id is null then
    raise exception 'No portfolio found for this user';
  end if;

  select id, market into v_ticker_id, v_market from tickers where symbol = p_symbol;
  if v_ticker_id is null then
    raise exception 'Unknown ticker: %', p_symbol;
  end if;

  select close into v_price
  from price_snapshots
  where ticker_id = v_ticker_id
  order by snapshot_date desc
  limit 1;

  if v_price is null then
    raise exception 'No price data available for %', p_symbol;
  end if;

  v_trade_value := v_price * p_quantity;

  select quantity, avg_cost into v_held_qty, v_held_avg_cost
  from holdings
  where portfolio_id = v_portfolio_id and ticker_id = v_ticker_id;

  v_held_qty := coalesce(v_held_qty, 0);

  if p_side = 'buy' then
    if v_market = 'US' then
      select cash_balance_usd into v_cash_usd from portfolios where id = v_portfolio_id;
      if v_cash_usd < v_trade_value then
        raise exception 'Insufficient USD cash balance';
      end if;
      update portfolios
        set cash_balance_usd = cash_balance_usd - v_trade_value
        where id = v_portfolio_id;
    else
      select cash_balance_pkr into v_cash_pkr from portfolios where id = v_portfolio_id;
      if v_cash_pkr < v_trade_value then
        raise exception 'Insufficient PKR cash balance';
      end if;
      update portfolios
        set cash_balance_pkr = cash_balance_pkr - v_trade_value
        where id = v_portfolio_id;
    end if;

    v_new_avg_cost :=
      (v_held_qty * coalesce(v_held_avg_cost, 0) + p_quantity * v_price) / (v_held_qty + p_quantity);

    insert into holdings (portfolio_id, ticker_id, quantity, avg_cost)
    values (v_portfolio_id, v_ticker_id, p_quantity, v_new_avg_cost)
    on conflict (portfolio_id, ticker_id)
    do update set quantity = holdings.quantity + p_quantity, avg_cost = v_new_avg_cost;

  else -- sell
    if v_held_qty < p_quantity then
      raise exception 'Insufficient shares held: have %, tried to sell %', v_held_qty, p_quantity;
    end if;

    if v_held_qty = p_quantity then
      delete from holdings where portfolio_id = v_portfolio_id and ticker_id = v_ticker_id;
    else
      update holdings
        set quantity = quantity - p_quantity
        where portfolio_id = v_portfolio_id and ticker_id = v_ticker_id;
    end if;

    if v_market = 'US' then
      update portfolios
        set cash_balance_usd = cash_balance_usd + v_trade_value
        where id = v_portfolio_id;
    else
      update portfolios
        set cash_balance_pkr = cash_balance_pkr + v_trade_value
        where id = v_portfolio_id;
    end if;
  end if;

  insert into transactions (portfolio_id, ticker_id, side, quantity, price)
  values (v_portfolio_id, v_ticker_id, p_side, p_quantity, v_price);
end;
$$;

revoke execute on function public.execute_trade(text, text, integer) from anon;
grant execute on function public.execute_trade(text, text, integer) to authenticated;
