"use client";

import { useActionState } from "react";

import { Select } from "@/components/Select";
import { Spinner } from "@/components/Spinner";
import { executeTradeAction, type TradeActionState } from "@/lib/actions/trade";
import type { StockListing } from "@/lib/queries/stocks";

const initialState: TradeActionState = {};

const INPUT_CLASS =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function TradeForm({
  stocks,
  defaultSymbol,
}: {
  stocks: StockListing[];
  defaultSymbol?: string;
}) {
  const [state, formAction, pending] = useActionState(executeTradeAction, initialState);
  const usTickers = stocks.filter((s) => s.market === "US");
  const psxTickers = stocks.filter((s) => s.market === "PSX");
  const initialSymbol =
    defaultSymbol && stocks.some((s) => s.symbol === defaultSymbol)
      ? defaultSymbol
      : stocks[0]?.symbol;

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        Stock
        <Select name="symbol" defaultValue={initialSymbol}>
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
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        Side
        <Select name="side" defaultValue="buy">
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400">
        Quantity
        <input
          type="number"
          name="quantity"
          min={1}
          step={1}
          defaultValue={1}
          required
          className={`${INPUT_CLASS} w-24`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending && <Spinner className="h-4 w-4" />}
        {pending ? "Placing…" : "Place order"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-sm text-emerald-600 dark:text-emerald-400">
          {state.success}
        </p>
      )}
    </form>
  );
}
