"use server";

import { revalidatePath } from "next/cache";

import { formatRatio } from "@/lib/format";
import { getStockListing } from "@/lib/queries/stocks";
import { createClient } from "@/lib/supabase/server";

export interface TradeActionState {
  error?: string;
  success?: string;
}

export async function executeTradeAction(
  _prevState: TradeActionState,
  formData: FormData,
): Promise<TradeActionState> {
  const symbol = formData.get("symbol");
  const side = formData.get("side");
  const quantityRaw = formData.get("quantity");

  if (typeof symbol !== "string" || !symbol) {
    return { error: "Pick a stock." };
  }
  if (side !== "buy" && side !== "sell") {
    return { error: "Invalid order side." };
  }

  const quantity = Number(quantityRaw);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Quantity must be a whole number greater than 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("execute_trade", {
    p_symbol: symbol,
    p_side: side,
    p_quantity: quantity,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portfolio");

  const baseMessage = `${side === "buy" ? "Bought" : "Sold"} ${quantity} ${symbol}.`;

  // A brief, contextual nudge on buys only — connects the trade just placed
  // back to a term the user has already seen on the listing page, rather
  // than leaving "you now own this" as a bare fact with no context.
  if (side === "buy") {
    const stocks = await getStockListing();
    const stock = stocks.find((s) => s.symbol === symbol);
    if (stock?.peRatio != null) {
      return {
        success: `${baseMessage} You paid ${formatRatio(stock.peRatio)}x last year's earnings per share (P/E) for it.`,
      };
    }
  }

  return { success: baseMessage };
}
