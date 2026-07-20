import Link from "next/link";

import { TermExplainer } from "@/components/TermExplainer";
import { createClient } from "@/lib/supabase/server";
import {
  formatChangePercent,
  formatMarketCap,
  formatPercent,
  formatPrice,
  formatRatio,
  formatVolume,
  formatWeek52Range,
  getChangeDirection,
  getChangePercent,
  SIGNIFICANT_MOVE_THRESHOLD_PERCENT,
} from "@/lib/format";
import { getStockListing, type StockListing } from "@/lib/queries/stocks";
import { getTermsByKey, type Term } from "@/lib/queries/terms";

const CHANGE_DIRECTION_CLASS = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  flat: "text-zinc-500 dark:text-zinc-400",
} as const;

const TERM_TRIGGER_CLASS =
  "underline decoration-dotted decoration-zinc-400 underline-offset-2 hover:decoration-zinc-600 dark:hover:decoration-zinc-300";

const FALLBACK_TERM: Term = {
  key: "unknown",
  title: "Explainer coming soon",
  explainer: "We don't have a write-up for this yet.",
};

/**
 * US and PSX ingestion run on separate schedules (see vercel.json), so one
 * market's data can lag the other's — a single shared "as of" date would
 * misrepresent whichever market is stale. Takes the max across the given
 * list rather than assuming every ticker in it ingested on the same run.
 */
function latestSnapshotDate(stocks: StockListing[]): string | undefined {
  return stocks.reduce<string | undefined>(
    (latest, stock) =>
      latest == null || stock.snapshotDate > latest ? stock.snapshotDate : latest,
    undefined,
  );
}

function HeaderTerm({ label, term }: { label: string; term: Term }) {
  return (
    <TermExplainer
      trigger={label}
      triggerClassName={TERM_TRIGGER_CLASS}
      title={term.title}
      explainer={term.explainer}
    />
  );
}

function StockTable({
  stocks,
  terms,
}: {
  stocks: StockListing[];
  terms: Map<string, Term>;
}) {
  const peTerm = terms.get("pe_ratio") ?? FALLBACK_TERM;
  const marketCapTerm = terms.get("market_cap") ?? FALLBACK_TERM;
  const week52Term = terms.get("52_week_range") ?? FALLBACK_TERM;
  const significantMoveTerm = terms.get("significant_move") ?? FALLBACK_TERM;
  const volumeTerm = terms.get("volume") ?? FALLBACK_TERM;
  const dividendYieldTerm = terms.get("dividend_yield") ?? FALLBACK_TERM;
  const epsTerm = terms.get("eps") ?? FALLBACK_TERM;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[1120px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <th className="px-4 py-2.5 font-medium whitespace-nowrap">Symbol</th>
            <th className="px-4 py-2.5 font-medium whitespace-nowrap">Name</th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              Price
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              Change
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <HeaderTerm label="P/E" term={peTerm} />
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <HeaderTerm label="EPS" term={epsTerm} />
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <HeaderTerm label="Div Yield" term={dividendYieldTerm} />
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <HeaderTerm label="Market Cap" term={marketCapTerm} />
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <HeaderTerm label="52W Range" term={week52Term} />
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <HeaderTerm label="Volume" term={volumeTerm} />
            </th>
            <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
              <span className="sr-only">Trade</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const direction = getChangeDirection(stock.close, stock.previousClose);
            const changePercent = getChangePercent(stock.close, stock.previousClose);
            const isSignificantMove =
              changePercent != null &&
              Math.abs(changePercent) >= SIGNIFICANT_MOVE_THRESHOLD_PERCENT;

            return (
              <tr
                key={stock.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                  <Link href={`/stocks/${stock.symbol}`} className="hover:underline">
                    {stock.symbol}
                  </Link>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {stock.name}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {formatPrice(stock.close, stock.market)}
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${CHANGE_DIRECTION_CLASS[direction]}`}
                >
                  {formatChangePercent(stock.close, stock.previousClose)}
                  {isSignificantMove && (
                    <TermExplainer
                      trigger="●"
                      triggerClassName="ml-1 align-middle text-amber-500 dark:text-amber-400"
                      title={significantMoveTerm.title}
                      explainer={significantMoveTerm.explainer}
                    />
                  )}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {formatRatio(stock.peRatio)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {stock.eps == null ? "—" : formatPrice(stock.eps, stock.market)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {formatPercent(stock.dividendYield)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {formatMarketCap(stock.marketCap, stock.market)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {formatWeek52Range(stock.week52Low, stock.week52High, stock.market)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                  {formatVolume(stock.volume)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link
                    href={`/portfolio?symbol=${stock.symbol}`}
                    className="text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Trade
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const [stocks, terms, { data: userData }] = await Promise.all([
    getStockListing(),
    getTermsByKey(),
    supabase.auth.getUser(),
  ]);
  const usStocks = stocks.filter((s) => s.market === "US");
  const psxStocks = stocks.filter((s) => s.market === "PSX");

  if (stocks.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Markets</h1>
        <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
          No price data yet — run the ingestion cron routes to populate the listing.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Markets</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Delayed prices — see each market below for its last update.
        </p>
      </header>

      {!userData.user && (
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Learn by doing, not just reading.
          </p>
          <p className="mt-1">
            Tap any underlined term below to see what it means, then{" "}
            <Link
              href="/signup"
              className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              create a free account
            </Link>{" "}
            to start paper trading with $100,000 in fake cash — real prices, zero
            financial risk.
          </p>
        </section>
      )}

      {usStocks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">US Tech</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              As of {latestSnapshotDate(usStocks)}
            </p>
          </div>
          <StockTable stocks={usStocks} terms={terms} />
        </section>
      )}

      {psxStocks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pakistan Stock Exchange</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              As of {latestSnapshotDate(psxStocks)}
            </p>
          </div>
          <StockTable stocks={psxStocks} terms={terms} />
        </section>
      )}
    </main>
  );
}
