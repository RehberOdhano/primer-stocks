# Sarmaya

Investment education app — stock data and paper trading, taught in context.
See `CLAUDE.md` for product scope and the locked architecture.

## Setup

1. **Install dependencies**

   ```
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free
   tier). From Project Settings > API, copy the project URL and anon key.

3. **Run the migrations** against that project — either paste the contents of
   `supabase/migrations/0001_init.sql` then `0002_seed.sql` into the Supabase
   SQL editor, or, with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
   installed and linked to the project:

   ```
   supabase db push
   ```

4. **Get a Finnhub API key** (free tier) at [finnhub.io](https://finnhub.io) —
   used by the US price-ingestion cron.

5. **Copy `.env.example` to `.env.local`** and fill in all values. Generate
   `CRON_SECRET` with `openssl rand -hex 32`.

6. **Run the dev server**

   ```
   npm run dev
   ```

   `src/proxy.ts` refreshes the Supabase session on every request, so
   `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set
   before any page — including the homepage — will load.

## Deploying

Deploy to Vercel and set the same env vars from `.env.local` as project env
vars (including `CRON_SECRET` — Vercel automatically sends it as the
`Authorization` bearer token on cron invocations once it's set). The cron
schedules are defined in `vercel.json`:

- `/api/cron/ingest-us` — weekdays at 21:00 UTC (after US market close)
- `/api/cron/ingest-psx` — weekdays at 11:30 UTC (after PSX market close)

## Commands

| Command                | Does what                          |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the dev server               |
| `npm run build`        | Production build                   |
| `npm run lint`         | ESLint                             |
| `npm run typecheck`    | `tsc --noEmit`                     |
| `npm run format`       | Prettier, write mode               |
| `npm run format:check` | Prettier, check mode (CI-friendly) |

## Known limitations (v1 scaffold)

- PSX price data comes from PSX's own public portal endpoints, which carry
  ToS language restricting automated/non-personal use — see the "Known
  caveat" note in `CLAUDE.md`.
- PSX ingestion has no fundamentals source: `pe_ratio` and `market_cap` are
  always null for `psx_portal`-sourced rows. US rows (Finnhub) have both.
- 52-week high/low for PSX is not available from PSX's endpoints at all and
  isn't backfilled — it'll only be derivable once enough daily snapshots
  accumulate in `price_snapshots`, and that logic isn't built yet.
