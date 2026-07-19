import Link from "next/link";

import { PortfolioChart } from "@/components/PortfolioChart";
import { TradeForm } from "@/components/TradeForm";
import { formatPrice } from "@/lib/format";
import {
  getPortfolio,
  getPortfolioValueHistory,
  getTransactionHistory,
} from "@/lib/queries/portfolio";
import { getStockListing } from "@/lib/queries/stocks";

function formatSignedPrice(value: number, market: "US" | "PSX"): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatPrice(value, market)}`;
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const [stocks, params] = await Promise.all([getStockListing(), searchParams]);
  const portfolio = await getPortfolio(stocks);

  if (!portfolio) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <h1 className="text-2xl font-semibold">Portfolio not found</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Something went wrong setting up your portfolio — try logging out and back in.
        </p>
      </main>
    );
  }

  const [valueHistory, transactions] = await Promise.all([
    getPortfolioValueHistory(portfolio.id),
    getTransactionHistory(portfolio.id, stocks),
  ]);

  const usHoldings = portfolio.holdings.filter((h) => h.market === "US");
  const psxHoldings = portfolio.holdings.filter((h) => h.market === "PSX");

  const holdingsValueUsd = usHoldings.reduce(
    (sum, h) => sum + h.quantity * (h.currentPrice ?? h.avgCost),
    0,
  );
  const holdingsValuePkr = psxHoldings.reduce(
    (sum, h) => sum + h.quantity * (h.currentPrice ?? h.avgCost),
    0,
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Fake money, real prices — practice without the risk.
        </p>
      </header>

      {!portfolio.hasTradedBefore && (
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            You&apos;re starting with $100,000 fake USD and PKR 5,000,000.
          </p>
          <p className="mt-1">
            Pick a stock below, place a trade, and watch how it moves your P&amp;L over
            time. Any underlined word on the listing page has a tap-to-read explainer if
            you&apos;re not sure what it means.
          </p>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">USD account</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatPrice(portfolio.cashUsd + holdingsValueUsd, "US")}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {formatPrice(portfolio.cashUsd, "US")} cash +{" "}
            {formatPrice(holdingsValueUsd, "US")} in holdings
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">PKR account</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatPrice(portfolio.cashPkr + holdingsValuePkr, "PSX")}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {formatPrice(portfolio.cashPkr, "PSX")} cash +{" "}
            {formatPrice(holdingsValuePkr, "PSX")} in holdings
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Performance</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">USD account</p>
            <PortfolioChart history={valueHistory} market="US" />
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">PKR account</p>
            <PortfolioChart history={valueHistory} market="PSX" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Place an order</h2>
        <TradeForm stocks={stocks} defaultSymbol={params.symbol} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Holdings</h2>
        {portfolio.holdings.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No positions yet — place an order above to get started.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Symbol</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Qty
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Avg Cost
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Current Price
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Value
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Unrealized P&amp;L
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((holding) => {
                  const price = holding.currentPrice ?? holding.avgCost;
                  const value = holding.quantity * price;
                  const pnl = (price - holding.avgCost) * holding.quantity;
                  const pnlClass =
                    pnl > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : pnl < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-500 dark:text-zinc-400";

                  return (
                    <tr
                      key={holding.tickerId}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                    >
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                        <Link
                          href={`/stocks/${holding.symbol}`}
                          className="hover:underline"
                        >
                          {holding.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {holding.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {formatPrice(holding.avgCost, holding.market)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {formatPrice(price, holding.market)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {formatPrice(value, holding.market)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${pnlClass}`}
                      >
                        {formatSignedPrice(pnl, holding.market)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent trades</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No trades yet — your order history will show up here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Symbol</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Side</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Qty
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Price
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const sideClass =
                    tx.side === "buy"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400";

                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {new Date(tx.executedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                        <Link href={`/stocks/${tx.symbol}`} className="hover:underline">
                          {tx.symbol}
                        </Link>
                      </td>
                      <td
                        className={`px-4 py-2.5 font-medium whitespace-nowrap capitalize ${sideClass}`}
                      >
                        {tx.side}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {tx.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {formatPrice(tx.price, tx.market)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">
                        {formatPrice(tx.price * tx.quantity, tx.market)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
