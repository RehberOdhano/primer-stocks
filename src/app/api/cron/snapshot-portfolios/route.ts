import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Runs after both price ingestion crons (see vercel.json ordering) so it
 * reads that day's freshest prices. Snapshots every user's total portfolio
 * value — cash + holdings, per currency — for a future performance-over-time
 * chart. Uses the admin client since it needs every user's data, not just
 * the caller's own (there is no "caller" — this is a trusted system job).
 */
export async function GET(request: Request) {
  const { CRON_SECRET } = getServerEnv();

  if (!isAuthorized(request, CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [
    { data: portfolios, error: portfoliosError },
    { data: holdings, error: holdingsError },
    { data: snapshots, error: snapshotsError },
  ] = await Promise.all([
    supabase.from("portfolios").select("*"),
    supabase.from("holdings").select("*"),
    supabase
      .from("price_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false }),
  ]);

  if (portfoliosError)
    return NextResponse.json({ error: portfoliosError.message }, { status: 500 });
  if (holdingsError)
    return NextResponse.json({ error: holdingsError.message }, { status: 500 });
  if (snapshotsError)
    return NextResponse.json({ error: snapshotsError.message }, { status: 500 });

  const latestPriceByTickerId = new Map<string, { close: number }>();
  for (const snapshot of snapshots ?? []) {
    if (!latestPriceByTickerId.has(snapshot.ticker_id)) {
      latestPriceByTickerId.set(snapshot.ticker_id, { close: snapshot.close });
    }
  }

  const { data: tickers, error: tickersError } = await supabase
    .from("tickers")
    .select("*");
  if (tickersError)
    return NextResponse.json({ error: tickersError.message }, { status: 500 });

  const tickerById = new Map((tickers ?? []).map((t) => [t.id, t]));

  const holdingsByPortfolio = new Map<string, typeof holdings>();
  for (const holding of holdings ?? []) {
    const list = holdingsByPortfolio.get(holding.portfolio_id) ?? [];
    list.push(holding);
    holdingsByPortfolio.set(holding.portfolio_id, list);
  }

  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.allSettled(
    (portfolios ?? []).map(async (portfolio) => {
      const portfolioHoldings = holdingsByPortfolio.get(portfolio.id) ?? [];

      let holdingsValueUsd = 0;
      let holdingsValuePkr = 0;

      for (const holding of portfolioHoldings) {
        const ticker = tickerById.get(holding.ticker_id);
        const price = latestPriceByTickerId.get(holding.ticker_id)?.close;
        if (!ticker || price == null) continue;

        if (ticker.market === "US") {
          holdingsValueUsd += holding.quantity * price;
        } else {
          holdingsValuePkr += holding.quantity * price;
        }
      }

      const { error: upsertError } = await supabase
        .from("portfolio_value_snapshots")
        .upsert(
          {
            portfolio_id: portfolio.id,
            snapshot_date: today,
            cash_usd: portfolio.cash_balance_usd,
            cash_pkr: portfolio.cash_balance_pkr,
            holdings_value_usd: holdingsValueUsd,
            holdings_value_pkr: holdingsValuePkr,
          },
          { onConflict: "portfolio_id,snapshot_date" },
        );

      if (upsertError) throw new Error(`${portfolio.id}: ${upsertError.message}`);
      return portfolio.id;
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  return NextResponse.json({ succeeded, failed });
}
