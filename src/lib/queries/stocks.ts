import { createClient } from "@/lib/supabase/server";
import type { Market } from "@/types/database";

export interface StockListing {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  sector: string | null;
  close: number;
  previousClose: number | null;
  volume: number | null;
  peRatio: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  dividendYield: number | null;
  eps: number | null;
  snapshotDate: string;
}

/**
 * Two plain queries + an in-memory join, rather than one PostgREST embedded
 * query. Simpler to type correctly against our hand-written Database type,
 * and plenty fast at this data volume (tens of tickers, one row/ticker/day).
 * Revisit if/when historical retention makes price_snapshots large enough
 * that fetching the whole table becomes wasteful.
 */
export async function getStockListing(): Promise<StockListing[]> {
  const supabase = await createClient();

  const [
    { data: tickers, error: tickersError },
    { data: snapshots, error: snapshotsError },
  ] = await Promise.all([
    supabase.from("tickers").select("*").order("symbol"),
    supabase
      .from("price_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false }),
  ]);

  if (tickersError) throw new Error(tickersError.message);
  if (snapshotsError) throw new Error(snapshotsError.message);

  // snapshots is already sorted newest-first, so the first entry seen per
  // ticker_id is the latest one.
  const latestSnapshotByTicker = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots ?? []) {
    if (!latestSnapshotByTicker.has(snapshot.ticker_id)) {
      latestSnapshotByTicker.set(snapshot.ticker_id, snapshot);
    }
  }

  const listings: StockListing[] = [];
  for (const ticker of tickers ?? []) {
    const snapshot = latestSnapshotByTicker.get(ticker.id);
    if (!snapshot) continue; // no price data ingested yet for this ticker

    listings.push({
      id: ticker.id,
      symbol: ticker.symbol,
      name: ticker.name,
      market: ticker.market,
      sector: ticker.sector,
      close: snapshot.close,
      previousClose: snapshot.previous_close,
      volume: snapshot.volume,
      peRatio: snapshot.pe_ratio,
      marketCap: snapshot.market_cap,
      week52High: snapshot.week52_high,
      week52Low: snapshot.week52_low,
      dividendYield: snapshot.dividend_yield,
      eps: snapshot.eps,
      snapshotDate: snapshot.snapshot_date,
    });
  }

  return listings;
}

export interface PriceHistoryPoint {
  date: string;
  close: number;
}

/** Oldest first, for charting. One row per trading day the ingestion cron has run. */
export async function getPriceHistory(
  tickerId: string,
  limit = 90,
): Promise<PriceHistoryPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("price_snapshots")
    .select("snapshot_date, close")
    .eq("ticker_id", tickerId)
    .order("snapshot_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => ({ date: row.snapshot_date, close: row.close }))
    .reverse();
}

export interface MarketBenchmark {
  /** Equal-weighted average return across every tracked ticker in the market. */
  returnPercent: number;
  /** Earliest snapshot date any tracked ticker in the market has — the comparison window's start. */
  sinceDate: string;
}

/**
 * "If you'd put an equal amount into every tracked stock in this market
 * instead" — the simplest honest benchmark a paper-trading app can offer
 * without a licensed index feed. Built from the same price_snapshots history
 * already being collected, so it costs nothing extra to compute.
 */
export async function getMarketBenchmark(
  market: Market,
): Promise<MarketBenchmark | null> {
  const supabase = await createClient();

  const { data: tickers, error: tickersError } = await supabase
    .from("tickers")
    .select("id")
    .eq("market", market);

  if (tickersError) throw new Error(tickersError.message);
  const tickerIds = (tickers ?? []).map((t) => t.id);
  if (tickerIds.length === 0) return null;

  const { data: snapshots, error } = await supabase
    .from("price_snapshots")
    .select("ticker_id, snapshot_date, close")
    .in("ticker_id", tickerIds)
    .order("snapshot_date", { ascending: true });

  if (error) throw new Error(error.message);
  if (!snapshots || snapshots.length === 0) return null;

  const firstByTicker = new Map<string, { date: string; close: number }>();
  const lastByTicker = new Map<string, { date: string; close: number }>();
  for (const row of snapshots) {
    if (!firstByTicker.has(row.ticker_id)) {
      firstByTicker.set(row.ticker_id, { date: row.snapshot_date, close: row.close });
    }
    // Ascending order, so the final write for each ticker is its latest close.
    lastByTicker.set(row.ticker_id, { date: row.snapshot_date, close: row.close });
  }

  const returns: number[] = [];
  let sinceDate: string | null = null;
  for (const [tickerId, first] of firstByTicker) {
    const last = lastByTicker.get(tickerId);
    if (!last || first.close === 0) continue;
    returns.push(((last.close - first.close) / first.close) * 100);
    if (sinceDate == null || first.date < sinceDate) sinceDate = first.date;
  }

  if (returns.length === 0 || sinceDate == null) return null;

  const returnPercent = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  return { returnPercent, sinceDate };
}
