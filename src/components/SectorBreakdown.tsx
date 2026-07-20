import { formatPrice } from "@/lib/format";
import type { Market } from "@/types/database";

export interface SectorHolding {
  sector: string | null;
  value: number;
}

export function SectorBreakdown({
  holdings,
  market,
}: {
  holdings: SectorHolding[];
  market: Market;
}) {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  if (totalValue <= 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No positions yet.</p>;
  }

  const valueBySector = new Map<string, number>();
  for (const holding of holdings) {
    const key = holding.sector ?? "Other";
    valueBySector.set(key, (valueBySector.get(key) ?? 0) + holding.value);
  }

  const slices = Array.from(valueBySector.entries())
    .map(([sector, value]) => ({ sector, value, percent: (value / totalValue) * 100 }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-3">
      {slices.map((slice) => (
        <div key={slice.sector}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-medium">{slice.sector}</span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
              {slice.percent.toFixed(1)}% · {formatPrice(slice.value, market)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
              style={{ width: `${slice.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
