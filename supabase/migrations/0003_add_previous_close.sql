-- "Daily change" conventionally means vs. the previous trading day's close,
-- not vs. today's open. Both Finnhub (quote.pc) and PSX's market-watch
-- (the LDCP column) provide this directly, even on a single ingestion run.
alter table price_snapshots add column previous_close numeric;
