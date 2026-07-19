import "server-only";

import { z } from "zod";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const quoteSchema = z.object({
  c: z.number(), // current price
  h: z.number(), // day high
  l: z.number(), // day low
  o: z.number(), // day open
  pc: z.number(), // previous close
  t: z.number(), // unix timestamp
});

const basicFinancialsSchema = z.object({
  metric: z
    .object({
      peTTM: z.number().nullable().optional(),
      marketCapitalization: z.number().nullable().optional(),
      "52WeekHigh": z.number().nullable().optional(),
      "52WeekLow": z.number().nullable().optional(),
      dividendYieldIndicatedAnnual: z.number().nullable().optional(),
      epsTTM: z.number().nullable().optional(),
    })
    .partial(),
});

export interface FinnhubSnapshot {
  symbol: string;
  open: number;
  close: number;
  previousClose: number;
  peRatio: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  dividendYield: number | null;
  eps: number | null;
}

async function finnhubGet(path: string, params: Record<string, string>, apiKey: string) {
  const url = new URL(`${FINNHUB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("token", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Finnhub request failed (${response.status}): ${path}`);
  }
  return response.json();
}

/**
 * Fetches quote + basic financials for one US ticker and merges them into a
 * single snapshot. Two calls per ticker — with a ~20-30 ticker universe on a
 * once/twice-daily cron, this stays well under Finnhub's free-tier limits.
 */
export async function fetchFinnhubSnapshot(
  symbol: string,
  apiKey: string,
): Promise<FinnhubSnapshot> {
  const [quoteRaw, financialsRaw] = await Promise.all([
    finnhubGet("/quote", { symbol }, apiKey),
    finnhubGet("/stock/metric", { symbol, metric: "all" }, apiKey),
  ]);

  const quote = quoteSchema.parse(quoteRaw);
  const financials = basicFinancialsSchema.parse(financialsRaw);
  const metric = financials.metric;

  return {
    symbol,
    open: quote.o,
    close: quote.c,
    previousClose: quote.pc,
    peRatio: metric.peTTM ?? null,
    // Finnhub reports market cap in millions of USD; normalize to raw USD.
    marketCap:
      metric.marketCapitalization != null
        ? metric.marketCapitalization * 1_000_000
        : null,
    week52High: metric["52WeekHigh"] ?? null,
    week52Low: metric["52WeekLow"] ?? null,
    dividendYield: metric.dividendYieldIndicatedAnnual ?? null,
    eps: metric.epsTTM ?? null,
  };
}
