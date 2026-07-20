import "server-only";

import * as cheerio from "cheerio";
import { z } from "zod";

const PSX_BASE_URL = "https://dps.psx.com.pk";

// PSX's own site works without one via server-side fetch, but a realistic
// User-Agent is a defensive measure against basic bot filtering.
const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; PrimerStocksEducationBot/1.0; +https://github.com/)",
};

const eodResponseSchema = z.object({
  status: z.number(),
  data: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])),
});

export interface PsxEodPoint {
  date: string; // YYYY-MM-DD
  open: number;
  volume: number;
  close: number;
}

/**
 * PSX's EOD endpoint returns only [timestamp, open, volume, close] — no
 * high/low. We do not fabricate a 52-week high/low from this; it can only be
 * derived once enough daily snapshots have accumulated in our own DB.
 */
export async function fetchPsxEodHistory(symbol: string): Promise<PsxEodPoint[]> {
  const response = await fetch(`${PSX_BASE_URL}/timeseries/eod/${symbol}`, {
    headers: REQUEST_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PSX EOD request failed (${response.status}) for ${symbol}`);
  }

  const parsed = eodResponseSchema.parse(await response.json());

  return parsed.data.map(([timestampSeconds, open, volume, close]) => ({
    date: new Date(timestampSeconds * 1000).toISOString().slice(0, 10),
    open,
    volume,
    close,
  }));
}

export interface PsxMarketWatchRow {
  symbol: string;
  open: number;
  current: number;
  previousClose: number;
  volume: number;
}

// Column order as of the current /market-watch table markup: SYMBOL, SECTOR
// (numeric code, not a label), LISTED IN, LDCP, OPEN, HIGH, LOW, CURRENT,
// CHANGE, CHANGE (%), VOLUME. LDCP ("Last Day Closing Price") is the
// previous close. Only the columns we actually use are named here; PSX can
// add/reorder columns without notice, so row length is checked defensively
// rather than assumed.
const MARKET_WATCH_COLUMNS = {
  symbol: 0,
  previousClose: 3,
  open: 4,
  current: 7,
  volume: 10,
} as const;
const MARKET_WATCH_MIN_COLUMNS = 11;

/**
 * PSX doesn't publish a JSON quote endpoint — /market-watch is an HTML
 * table. No fundamentals (P/E, market cap) are available from either PSX
 * endpoint used here; price_snapshots rows sourced from `psx_portal` will
 * have those columns null until a fundamentals source is found.
 */
export async function fetchPsxMarketWatch(): Promise<PsxMarketWatchRow[]> {
  const response = await fetch(`${PSX_BASE_URL}/market-watch`, {
    headers: REQUEST_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PSX market-watch request failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const rows: PsxMarketWatchRow[] = [];

  $("table.tbl tbody tr").each((_, el) => {
    const cells = $(el).find("td");
    if (cells.length < MARKET_WATCH_MIN_COLUMNS) return;

    const symbol = $(cells[MARKET_WATCH_COLUMNS.symbol]).text().trim();
    // Numeric columns carry the precise value in data-order (visible text
    // has commas, "%" signs, and an icon glyph mixed in).
    const open = Number($(cells[MARKET_WATCH_COLUMNS.open]).attr("data-order"));
    const current = Number($(cells[MARKET_WATCH_COLUMNS.current]).attr("data-order"));
    const previousClose = Number(
      $(cells[MARKET_WATCH_COLUMNS.previousClose]).attr("data-order"),
    );
    const volume = Number($(cells[MARKET_WATCH_COLUMNS.volume]).attr("data-order"));

    if (!symbol || [open, current, previousClose, volume].some((v) => Number.isNaN(v))) {
      return;
    }

    rows.push({ symbol, open, current, previousClose, volume });
  });

  return rows;
}
