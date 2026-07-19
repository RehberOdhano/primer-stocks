"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Select } from "@/components/Select";
import { TermExplainer } from "@/components/TermExplainer";
import {
  formatChangePercent,
  formatMarketCap,
  formatPercent,
  formatPrice,
  formatRatio,
  formatWeek52Range,
  getChangeDirection,
} from "@/lib/format";
import type { StockListing } from "@/lib/queries/stocks";
import type { Term } from "@/lib/queries/terms";

const MIN_STOCKS = 2;
const MAX_STOCKS = 4;

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

// Defaults to one US + one PSX ticker to showcase cross-market comparison —
// the whole point of putting both universes in one app.
function defaultSymbols(stocks: StockListing[]): string[] {
  const firstUS = stocks.find((s) => s.market === "US");
  const firstPSX = stocks.find((s) => s.market === "PSX");
  const picks = [firstUS, firstPSX].filter((s): s is StockListing => s != null);
  return picks.length >= MIN_STOCKS
    ? picks.map((s) => s.symbol)
    : stocks.slice(0, MIN_STOCKS).map((s) => s.symbol);
}

export function CompareView({
  stocks,
  terms,
  initialSymbols,
}: {
  stocks: StockListing[];
  terms: Record<string, Term>;
  initialSymbols: string[];
}) {
  const router = useRouter();
  const validInitial = initialSymbols.filter((sym) =>
    stocks.some((s) => s.symbol === sym),
  );
  const [selected, setSelected] = useState<string[]>(() =>
    validInitial.length >= MIN_STOCKS
      ? validInitial.slice(0, MAX_STOCKS)
      : defaultSymbols(stocks),
  );

  function updateSelection(next: string[]) {
    setSelected(next);
    router.replace(`/compare?symbols=${next.join(",")}`, { scroll: false });
  }

  function handleSlotChange(index: number, symbol: string) {
    const next = [...selected];
    next[index] = symbol;
    updateSelection(next);
  }

  function addSlot() {
    const unused = stocks.find((s) => !selected.includes(s.symbol));
    if (!unused) return;
    updateSelection([...selected, unused.symbol]);
  }

  function removeSlot(index: number) {
    if (selected.length <= MIN_STOCKS) return;
    updateSelection(selected.filter((_, i) => i !== index));
  }

  const selectedStocks = useMemo(
    () =>
      selected
        .map((symbol) => stocks.find((s) => s.symbol === symbol))
        .filter((s): s is StockListing => s != null),
    [selected, stocks],
  );

  const usTickers = stocks.filter((s) => s.market === "US");
  const psxTickers = stocks.filter((s) => s.market === "PSX");

  const peTerm = terms.pe_ratio ?? FALLBACK_TERM;
  const epsTerm = terms.eps ?? FALLBACK_TERM;
  const dividendYieldTerm = terms.dividend_yield ?? FALLBACK_TERM;
  const marketCapTerm = terms.market_cap ?? FALLBACK_TERM;
  const week52Term = terms["52_week_range"] ?? FALLBACK_TERM;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {selected.map((symbol, index) => (
          <div key={index} className="flex items-center gap-1">
            <Select
              value={symbol}
              onChange={(e) => handleSlotChange(index, e.target.value)}
            >
              <optgroup label="US Tech">
                {usTickers.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol}
                  </option>
                ))}
              </optgroup>
              <optgroup label="PSX">
                {psxTickers.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol}
                  </option>
                ))}
              </optgroup>
            </Select>
            {selected.length > MIN_STOCKS && (
              <button
                type="button"
                onClick={() => removeSlot(index)}
                aria-label={`Remove ${symbol}`}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {selected.length < MAX_STOCKS && (
          <button
            type="button"
            onClick={addSlot}
            className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
          >
            + Add stock
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                &nbsp;
              </th>
              {selectedStocks.map((stock) => (
                <th key={stock.id} className="px-4 py-2.5 text-right whitespace-nowrap">
                  <div className="font-semibold">{stock.symbol}</div>
                  <div className="font-normal text-zinc-500 dark:text-zinc-400">
                    {stock.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                Price
              </td>
              {selectedStocks.map((stock) => (
                <td
                  key={stock.id}
                  className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                >
                  {formatPrice(stock.close, stock.market)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                Change
              </td>
              {selectedStocks.map((stock) => {
                const direction = getChangeDirection(stock.close, stock.previousClose);
                return (
                  <td
                    key={stock.id}
                    className={`px-4 py-2.5 text-right tabular-nums whitespace-nowrap ${CHANGE_DIRECTION_CLASS[direction]}`}
                  >
                    {formatChangePercent(stock.close, stock.previousClose)}
                  </td>
                );
              })}
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                <TermExplainer
                  trigger="P/E"
                  triggerClassName={TERM_TRIGGER_CLASS}
                  title={peTerm.title}
                  explainer={peTerm.explainer}
                />
              </td>
              {selectedStocks.map((stock) => (
                <td
                  key={stock.id}
                  className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                >
                  {formatRatio(stock.peRatio)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                <TermExplainer
                  trigger="EPS"
                  triggerClassName={TERM_TRIGGER_CLASS}
                  title={epsTerm.title}
                  explainer={epsTerm.explainer}
                />
              </td>
              {selectedStocks.map((stock) => (
                <td
                  key={stock.id}
                  className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                >
                  {stock.eps == null ? "—" : formatPrice(stock.eps, stock.market)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                <TermExplainer
                  trigger="Div Yield"
                  triggerClassName={TERM_TRIGGER_CLASS}
                  title={dividendYieldTerm.title}
                  explainer={dividendYieldTerm.explainer}
                />
              </td>
              {selectedStocks.map((stock) => (
                <td
                  key={stock.id}
                  className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                >
                  {formatPercent(stock.dividendYield)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                <TermExplainer
                  trigger="Market Cap"
                  triggerClassName={TERM_TRIGGER_CLASS}
                  title={marketCapTerm.title}
                  explainer={marketCapTerm.explainer}
                />
              </td>
              {selectedStocks.map((stock) => (
                <td
                  key={stock.id}
                  className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                >
                  {formatMarketCap(stock.marketCap, stock.market)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                <TermExplainer
                  trigger="52W Range"
                  triggerClassName={TERM_TRIGGER_CLASS}
                  title={week52Term.title}
                  explainer={week52Term.explainer}
                />
              </td>
              {selectedStocks.map((stock) => (
                <td
                  key={stock.id}
                  className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap"
                >
                  {formatWeek52Range(stock.week52Low, stock.week52High, stock.market)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                Sector
              </td>
              {selectedStocks.map((stock) => (
                <td key={stock.id} className="px-4 py-2.5 text-right whitespace-nowrap">
                  {stock.sector ?? "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Prices and market caps are shown in each stock&apos;s local currency (USD for US
        Tech, PKR for PSX) — P/E is a unitless ratio, so it&apos;s directly comparable
        across markets even when the currencies aren&apos;t.
      </p>
    </div>
  );
}
