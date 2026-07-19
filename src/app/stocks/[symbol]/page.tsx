import Link from "next/link";
import { notFound } from "next/navigation";

import { PriceChart } from "@/components/PriceChart";
import { TermExplainer } from "@/components/TermExplainer";
import {
  formatChangePercent,
  formatMarketCap,
  formatPercent,
  formatPrice,
  formatRatio,
  formatVolume,
  formatWeek52Range,
  getChangeDirection,
} from "@/lib/format";
import { getPriceHistory, getStockListing } from "@/lib/queries/stocks";
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

function StatCard({ label, term, value }: { label: string; term: Term; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <TermExplainer
        trigger={label}
        triggerClassName={`${TERM_TRIGGER_CLASS} text-sm text-zinc-500 dark:text-zinc-400`}
        title={term.title}
        explainer={term.explainer}
      />
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const [stocks, terms] = await Promise.all([getStockListing(), getTermsByKey()]);
  const stock = stocks.find((s) => s.symbol === symbol.toUpperCase());

  if (!stock) notFound();

  const history = await getPriceHistory(stock.id);

  const direction = getChangeDirection(stock.close, stock.previousClose);
  const peTerm = terms.get("pe_ratio") ?? FALLBACK_TERM;
  const epsTerm = terms.get("eps") ?? FALLBACK_TERM;
  const dividendYieldTerm = terms.get("dividend_yield") ?? FALLBACK_TERM;
  const marketCapTerm = terms.get("market_cap") ?? FALLBACK_TERM;
  const week52Term = terms.get("52_week_range") ?? FALLBACK_TERM;
  const volumeTerm = terms.get("volume") ?? FALLBACK_TERM;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Back to listing
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{stock.symbol}</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {stock.name} · {stock.market === "US" ? "US Tech" : "Pakistan Stock Exchange"}
            {stock.sector ? ` · ${stock.sector}` : ""}
          </p>
          <p className={`mt-1 text-sm tabular-nums ${CHANGE_DIRECTION_CLASS[direction]}`}>
            {formatChangePercent(stock.close, stock.previousClose)} today
          </p>
        </div>
        <Link
          href={`/portfolio?symbol=${stock.symbol}`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium whitespace-nowrap text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Trade
        </Link>
      </header>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <PriceChart points={history} market={stock.market} />
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="P/E" term={peTerm} value={formatRatio(stock.peRatio)} />
        <StatCard
          label="EPS"
          term={epsTerm}
          value={stock.eps == null ? "—" : formatPrice(stock.eps, stock.market)}
        />
        <StatCard
          label="Div Yield"
          term={dividendYieldTerm}
          value={formatPercent(stock.dividendYield)}
        />
        <StatCard
          label="Market Cap"
          term={marketCapTerm}
          value={formatMarketCap(stock.marketCap, stock.market)}
        />
        <StatCard
          label="52W Range"
          term={week52Term}
          value={formatWeek52Range(stock.week52Low, stock.week52High, stock.market)}
        />
        <StatCard label="Volume" term={volumeTerm} value={formatVolume(stock.volume)} />
      </section>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Delayed prices as of {stock.snapshotDate}.
      </p>
    </main>
  );
}
