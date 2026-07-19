-- Dividend yield and EPS were already seeded as education terms (0002) but
-- had no backing data column. Finnhub's basic-financials response (already
-- fetched by ingest-us for P/E and market cap) includes both, so this adds
-- them for US tickers at no extra API cost. PSX's public endpoints still
-- don't expose fundamentals, so these stay null for psx_portal-sourced rows,
-- same as pe_ratio and market_cap already do.
alter table price_snapshots
  add column dividend_yield numeric,
  add column eps numeric;
