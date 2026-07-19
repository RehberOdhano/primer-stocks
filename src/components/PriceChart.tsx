import { buildLinePath } from "@/lib/chart";
import { formatPrice } from "@/lib/format";
import type { PriceHistoryPoint } from "@/lib/queries/stocks";
import type { Market } from "@/types/database";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 160;

export function PriceChart({
  points,
  market,
}: {
  points: PriceHistoryPoint[];
  market: Market;
}) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Not enough price history yet — this fills in as the daily ingestion job records
        more trading days.
      </p>
    );
  }

  const values = points.map((point) => point.close);
  const first = values[0]!;
  const last = values[values.length - 1]!;
  const changePercent = first === 0 ? 0 : ((last - first) / first) * 100;
  const isUp = last >= first;
  const strokeClass = isUp
    ? "stroke-emerald-500 dark:stroke-emerald-400"
    : "stroke-red-500 dark:stroke-red-400";

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-2xl font-semibold tabular-nums">{formatPrice(last, market)}</p>
        <p
          className={`text-sm tabular-nums ${
            isUp
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isUp ? "+" : ""}
          {changePercent.toFixed(2)}% since {points[0]!.date}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-40 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Price history"
      >
        <path
          d={buildLinePath(values, { width: CHART_WIDTH, height: CHART_HEIGHT })}
          fill="none"
          className={strokeClass}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
