import { buildLinePath } from "@/lib/chart";
import { formatPrice } from "@/lib/format";
import type { PortfolioValuePoint } from "@/lib/queries/portfolio";
import type { Market } from "@/types/database";

const CHART_WIDTH = 480;
const CHART_HEIGHT = 120;

/**
 * Plain inline SVG line chart — no charting library. One line per currency
 * pool rather than a single combined total, since the app deliberately never
 * fakes a USD/PKR conversion rate (see cash pools in the portfolio schema).
 */
export function PortfolioChart({
  history,
  market,
}: {
  history: PortfolioValuePoint[];
  market: Market;
}) {
  if (history.length < 2) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Check back tomorrow — this fills in once a full day of trading history has been
        recorded.
      </p>
    );
  }

  const values = history.map((point) =>
    market === "US" ? point.totalUsd : point.totalPkr,
  );
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
        <p className="text-lg font-semibold tabular-nums">{formatPrice(last, market)}</p>
        <p
          className={`text-sm tabular-nums ${
            isUp
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isUp ? "+" : ""}
          {changePercent.toFixed(2)}% since {history[0]!.date}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-24 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${market} portfolio value over time`}
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
