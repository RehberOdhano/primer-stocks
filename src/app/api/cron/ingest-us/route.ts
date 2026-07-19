import { NextResponse } from "next/server";

import { fetchFinnhubSnapshot } from "@/lib/data-sources/finnhub";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Pulls a quote + basic financials snapshot for every US ticker and upserts
 * one row per ticker per day into price_snapshots. Triggered by Vercel Cron
 * (see vercel.json); Vercel attaches the CRON_SECRET bearer token
 * automatically when that env var is set on the project.
 */
export async function GET(request: Request) {
  const { CRON_SECRET, FINNHUB_API_KEY } = getServerEnv();

  if (!isAuthorized(request, CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: tickers, error: tickersError } = await supabase
    .from("tickers")
    .select("id, symbol")
    .eq("market", "US");

  if (tickersError) {
    return NextResponse.json({ error: tickersError.message }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.allSettled(
    (tickers ?? []).map(async (ticker) => {
      const snapshot = await fetchFinnhubSnapshot(ticker.symbol, FINNHUB_API_KEY);

      const { error: upsertError } = await supabase.from("price_snapshots").upsert(
        {
          ticker_id: ticker.id,
          snapshot_date: today,
          open: snapshot.open,
          close: snapshot.close,
          previous_close: snapshot.previousClose,
          pe_ratio: snapshot.peRatio,
          market_cap: snapshot.marketCap,
          week52_high: snapshot.week52High,
          week52_low: snapshot.week52Low,
          dividend_yield: snapshot.dividendYield,
          eps: snapshot.eps,
          source: "finnhub",
        },
        { onConflict: "ticker_id,snapshot_date" },
      );

      if (upsertError) throw new Error(`${ticker.symbol}: ${upsertError.message}`);
      return ticker.symbol;
    }),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  return NextResponse.json({ succeeded, failed });
}
