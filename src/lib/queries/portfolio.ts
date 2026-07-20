import { createClient } from "@/lib/supabase/server";
import type { StockListing } from "@/lib/queries/stocks";
import type { Market } from "@/types/database";

export interface PortfolioHolding {
  tickerId: string;
  symbol: string;
  name: string;
  market: Market;
  sector: string | null;
  quantity: number;
  avgCost: number;
  currentPrice: number | null;
}

export interface PortfolioSummary {
  id: string;
  cashUsd: number;
  cashPkr: number;
  holdings: PortfolioHolding[];
  hasTradedBefore: boolean;
}

export interface PortfolioValuePoint {
  date: string;
  totalUsd: number;
  totalPkr: number;
}

export interface TransactionHistoryEntry {
  id: string;
  symbol: string;
  market: Market;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  executedAt: string;
}

/**
 * Returns null when there's no signed-in user or no portfolio row yet
 * (shouldn't happen post-signup given the auto-create trigger, but callers
 * should still handle it rather than assume).
 */
export async function getPortfolio(
  stocks: StockListing[],
): Promise<PortfolioSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("*")
    .single();

  if (portfolioError || !portfolio) return null;

  const { data: holdingsRows, error: holdingsError } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolio.id);

  if (holdingsError) throw new Error(holdingsError.message);

  const { count: transactionCount, error: transactionCountError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("portfolio_id", portfolio.id);

  if (transactionCountError) throw new Error(transactionCountError.message);

  const stockByTickerId = new Map(stocks.map((s) => [s.id, s]));

  const holdings: PortfolioHolding[] = (holdingsRows ?? [])
    .map((row): PortfolioHolding | null => {
      const stock = stockByTickerId.get(row.ticker_id);
      if (!stock) return null;
      return {
        tickerId: row.ticker_id,
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        sector: stock.sector,
        quantity: row.quantity,
        avgCost: row.avg_cost,
        currentPrice: stock.close,
      };
    })
    .filter((h): h is PortfolioHolding => h != null);

  return {
    id: portfolio.id,
    cashUsd: portfolio.cash_balance_usd,
    cashPkr: portfolio.cash_balance_pkr,
    holdings,
    hasTradedBefore: (transactionCount ?? 0) > 0,
  };
}

/**
 * Daily total value (cash + holdings) per currency pool, oldest first, for
 * the performance chart. Populated by the snapshot-portfolios cron — empty
 * until it has run at least once for this portfolio.
 */
export async function getPortfolioValueHistory(
  portfolioId: string,
): Promise<PortfolioValuePoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_value_snapshots")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("snapshot_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    date: row.snapshot_date,
    totalUsd: row.cash_usd + row.holdings_value_usd,
    totalPkr: row.cash_pkr + row.holdings_value_pkr,
  }));
}

export interface RealizedPnlSummary {
  realizedPnlUsd: number;
  realizedPnlPkr: number;
  closedTrades: number;
  winCount: number;
  lossCount: number;
}

/**
 * The transactions table only records each trade's own price, not the cost
 * basis it was closed against — so realized P&L on a sell isn't stored
 * anywhere and has to be reconstructed by replaying the full trade history
 * in order. This mirrors execute_trade()'s weighted-average cost logic
 * exactly (see 0005_paper_trading.sql): a buy updates the running average
 * cost, a sell leaves it unchanged and books (sell price - avg cost) * qty.
 */
export async function getRealizedPnlSummary(
  portfolioId: string,
  stocks: StockListing[],
): Promise<RealizedPnlSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("executed_at", { ascending: true });

  if (error) throw new Error(error.message);

  const stockByTickerId = new Map(stocks.map((s) => [s.id, s]));
  const runningByTicker = new Map<string, { quantity: number; avgCost: number }>();

  let realizedPnlUsd = 0;
  let realizedPnlPkr = 0;
  let closedTrades = 0;
  let winCount = 0;
  let lossCount = 0;

  for (const tx of data ?? []) {
    const stock = stockByTickerId.get(tx.ticker_id);
    if (!stock) continue;

    const running = runningByTicker.get(tx.ticker_id) ?? { quantity: 0, avgCost: 0 };

    if (tx.side === "buy") {
      const newQuantity = running.quantity + tx.quantity;
      const newAvgCost =
        (running.quantity * running.avgCost + tx.quantity * tx.price) / newQuantity;
      runningByTicker.set(tx.ticker_id, { quantity: newQuantity, avgCost: newAvgCost });
      continue;
    }

    const pnl = (tx.price - running.avgCost) * tx.quantity;
    if (stock.market === "US") {
      realizedPnlUsd += pnl;
    } else {
      realizedPnlPkr += pnl;
    }
    closedTrades += 1;
    if (pnl > 0) winCount += 1;
    else if (pnl < 0) lossCount += 1;

    runningByTicker.set(tx.ticker_id, {
      quantity: running.quantity - tx.quantity,
      avgCost: running.avgCost,
    });
  }

  return { realizedPnlUsd, realizedPnlPkr, closedTrades, winCount, lossCount };
}

/** Most recent trades first, joined with ticker symbol/market in memory. */
export async function getTransactionHistory(
  portfolioId: string,
  stocks: StockListing[],
  limit = 20,
): Promise<TransactionHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("portfolio_id", portfolioId)
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const stockByTickerId = new Map(stocks.map((s) => [s.id, s]));

  return (data ?? [])
    .map((row): TransactionHistoryEntry | null => {
      const stock = stockByTickerId.get(row.ticker_id);
      if (!stock) return null;
      return {
        id: row.id,
        symbol: stock.symbol,
        market: stock.market,
        side: row.side,
        quantity: row.quantity,
        price: row.price,
        executedAt: row.executed_at,
      };
    })
    .filter((t): t is TransactionHistoryEntry => t != null);
}
