# Primer Stocks

Investment education app. The core problem it solves: most people don't understand
stocks well enough to invest with confidence, and existing tools either just show
data (Yahoo Finance, TradingView) or just teach theory (Investopedia, Zerodha
Varsity) — never both together, in context. Primer Stocks teaches through contextual
explainers plus a paper-trading simulator, so users get consequences without
financial risk.

## Scope (deliberately narrow)

- US big tech / Silicon Valley: AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA, NFLX,
  AMD, INTC, CRM, ORCL, ADBE, and similar (~20-30 tickers)
- Pakistan Stock Exchange (PSX): major names across banking, cement, tech,
  energy (~20-30 tickers)
- Total universe: 40-60 stocks. Not comprehensive market coverage, and not
  meant to grow into it for v1.

**Non-goals for v1**: no live/real-time data, no real money or brokerage
integration, no exchanges beyond US tech + PSX, no social/community features.

## Core features

1. Stock listing — price, daily change, P/E, EPS, dividend yield, market cap,
   volume, 52-week range (delayed data is fine), plus a per-stock detail page
   with price history.
2. Contextual education — inline explainers triggered by an unfamiliar term
   (tap) or a significant price move, not a separate glossary/course section.
3. Paper trading simulator — fake starting capital in two separate pools
   (USD/PKR, no fake FX conversion between them), buy/sell at real (delayed)
   prices, portfolio tracking over time with a performance chart, an
   equal-weighted market benchmark comparison, realized P&L / win-rate stats,
   and a sector diversification breakdown. This is the primary learning
   mechanism.
4. Comparison view — side-by-side stock stats for relative valuation thinking.

## Architecture (locked)

- **Platform**: Next.js (App Router, TypeScript), responsive web, deployed on
  Vercel. Web-first — no native app in v1; wrap or port later only if there's
  real demand.
- **Backend**: Next.js route handlers. No separate backend service at this
  scale.
- **Database**: Supabase (Postgres + auth + RLS). Auth and RLS are why
  Supabase was picked over plain Postgres/Neon — paper-trading portfolios are
  per-user state that needs row-level isolation.
- **Data sources** — free tier only, no paid data budget for this project:
  - US tickers: Finnhub free tier (quote + basic financials). Alpha Vantage
    was ruled out — its free tier is capped at 25 requests/day, too tight for
    20-30 tickers plus fundamentals.
  - PSX tickers: the official PSX Data Portal's own public EOD endpoints
    (`dps.psx.com.pk`, e.g. `timeseries/eod/{SYMBOL}`) — free and authentic
    (real PSX data, not a third-party derivative). EODHD would give a fully
    licensed path with individual PSX ticker + fundamentals coverage, but
    costs $20-60/mo and was ruled out on cost.
    - **Known caveat**: PSX's stated terms restrict automated retrieval and
      non-personal use of that feed. Risk is low at this app's scale (daily
      poll of ~20-30 tickers, non-commercial, not redistributing a live feed)
      but it is not a fully clean license. Revisit if the user base or
      commercial intent ever grows.
- **Ingestion**: a scheduled job (Vercel Cron) is the _only_ caller of
  Finnhub/PSX — once or twice a day for US at market close, once a day for
  PSX at their EOD publish time. Writes into a `price_snapshots` table. A
  third daily cron runs after both price-ingestion jobs and snapshots every
  portfolio's total value into `portfolio_value_snapshots`, for the
  performance chart and benchmark comparison — it only re-reads that day's
  already-ingested prices, it doesn't call any third-party API.
- **Caching / rate limits**: solved structurally, not with a separate cache
  layer. The app always reads from Supabase; it never calls a third-party API
  on a user request. At 40-60 tickers on a daily cadence, both free tiers have
  large headroom.

### Schema sketch

- `tickers` (symbol, name, market, sector)
- `price_snapshots` (ticker_id, date, price fields: close, previous_close,
  volume, pe_ratio, market_cap, week52_high/low, dividend_yield, eps, source —
  dividend_yield/eps are US-only, PSX's public endpoints don't expose
  fundamentals)
- `terms` (key, explainer text, related context tags) — inline education
  content
- `portfolios` (per-user; two separate cash pools, `cash_balance_usd` and
  `cash_balance_pkr`, no fake FX conversion between them), `holdings`,
  `transactions` — paper-trading ledger; trades execute atomically via the
  `execute_trade()` Postgres function at the last stored snapshot price, no
  matching engine
- `portfolio_value_snapshots` — daily cash + holdings value per portfolio per
  currency, written by the third ingestion cron; backs the performance chart
  and benchmark comparison

## Common commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` / `npm run format:check` — Prettier

See `README.md` for first-time setup (Supabase project, migrations, env
vars).

## Working agreement

- Approach every change as a senior/staff engineer would at a top engineering
  org: favor industry-standard patterns, clear and boring solutions over
  clever ones, and code that is easy for the next person to read and change.
  Optimize for a codebase that stays clean, simple, secure, and maintainable
  as it grows — not just for the current commit.
- Apply security best practices by default (input validation at boundaries,
  no secrets in code, RLS on all user-scoped tables, standard OWASP
  awareness) without being asked each time.
- Do not add scope, abstractions, or "just in case" flexibility beyond what
  the current task needs.
- **Never `git commit` or `git push` unless explicitly asked in that turn.**
  This holds even after edits are approved and applied — approval to change
  files is not approval to commit or push them.
- **Never commit real secrets, and never write one into any file at all
  except `.env.local`.** This is broader than a git rule: a real Supabase
  key, Finnhub key, `CRON_SECRET`, or DB password must never appear in
  source code, comments, README.md, CLAUDE.md, migration files, commit
  messages, or anywhere else — even in a file that isn't about to be
  committed. `.env.local` is the one place live values belong; every other
  file gets placeholders (see `.env.example`) or references the variable
  name, never the value.
  - Enforced mechanically at the git layer by `.claude/hooks/git-safety.sh`,
    which hard-blocks (`deny`, not `ask`) any `git add`/`git commit`
    referencing a real `.env` file or using `-f`/`--force`.
  - `.gitignore` excludes `.env*` with a `!.env.example` exception — verify
    this exception still exists if `.gitignore` is ever edited, since a
    blanket `.env*` with no exception silently makes `.env.example`
    untrackable too (this happened once already; see git history).
  - Before treating any task involving credentials as done, grep the repo
    (tracked files + working tree, excluding `.env.local`) for the actual
    secret values and for generic patterns (JWTs, `sb_secret_`/
    `sb_publishable_`, long hex/alphanumeric tokens) — don't rely on memory
    of what was typed where.
