import { NextResponse } from "next/server";

import { fetchPsxMarketWatch } from "@/lib/data-sources/psx";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request, cronSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Pulls the full PSX market-watch table in one request and upserts a row
 * per tracked PSX ticker per day. No P/E or market cap here — PSX's public
 * endpoints don't expose fundamentals, so those columns stay null for
 * `psx_portal`-sourced rows until a fundamentals source is added.
 */
export async function GET(request: Request) {
  const { CRON_SECRET } = getServerEnv();

  if (!isAuthorized(request, CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: tickers, error: tickersError } = await supabase
    .from("tickers")
    .select("id, symbol")
    .eq("market", "PSX");

  if (tickersError) {
    return NextResponse.json({ error: tickersError.message }, { status: 500 });
  }

  const marketWatch = await fetchPsxMarketWatch();
  const bySymbol = new Map(marketWatch.map((row) => [row.symbol, row]));

  const today = new Date().toISOString().slice(0, 10);
  const results = await Promise.allSettled(
    (tickers ?? []).map(async (ticker) => {
      const row = bySymbol.get(ticker.symbol);
      if (!row) throw new Error(`${ticker.symbol}: not present in market-watch response`);

      const { error: upsertError } = await supabase.from("price_snapshots").upsert(
        {
          ticker_id: ticker.id,
          snapshot_date: today,
          open: row.open,
          close: row.current,
          previous_close: row.previousClose,
          volume: row.volume,
          week52_high: null,
          week52_low: null,
          source: "psx_portal",
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
