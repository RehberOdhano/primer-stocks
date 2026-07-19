import type { Market } from "@/types/database";

const CURRENCY_BY_MARKET: Record<Market, string> = {
  US: "USD",
  PSX: "PKR",
};

export function formatPrice(value: number, market: Market): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY_BY_MARKET[market],
    maximumFractionDigits: 2,
  }).format(value);
}

export const SIGNIFICANT_MOVE_THRESHOLD_PERCENT = 5;

export function getChangePercent(
  current: number,
  previousClose: number | null,
): number | null {
  if (previousClose == null || previousClose === 0) return null;
  return ((current - previousClose) / previousClose) * 100;
}

export function formatChangePercent(
  current: number,
  previousClose: number | null,
): string {
  const changePercent = getChangePercent(current, previousClose);
  if (changePercent == null) return "—";
  const sign = changePercent > 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(2)}%`;
}

export function getChangeDirection(
  current: number,
  previousClose: number | null,
): "up" | "down" | "flat" {
  if (previousClose == null) return "flat";
  if (current > previousClose) return "up";
  if (current < previousClose) return "down";
  return "flat";
}

export function formatMarketCap(value: number | null, market: Market): string {
  if (value == null) return "—";
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
  ];
  const symbol = market === "US" ? "$" : "PKR ";
  for (const [threshold, suffix] of units) {
    if (value >= threshold) return `${symbol}${(value / threshold).toFixed(2)}${suffix}`;
  }
  return `${symbol}${value.toFixed(0)}`;
}

export function formatRatio(value: number | null): string {
  return value == null ? "—" : value.toFixed(2);
}

export function formatPercent(value: number | null): string {
  return value == null ? "—" : `${value.toFixed(2)}%`;
}

export function formatVolume(value: number | null): string {
  if (value == null) return "—";
  const units: [number, string][] = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [threshold, suffix] of units) {
    if (value >= threshold) return `${(value / threshold).toFixed(1)}${suffix}`;
  }
  return value.toFixed(0);
}

export function formatWeek52Range(
  low: number | null,
  high: number | null,
  market: Market,
): string {
  if (low == null || high == null) return "—";
  return `${formatPrice(low, market)} – ${formatPrice(high, market)}`;
}
