export interface LinePathOptions {
  width: number;
  height: number;
  padding?: number;
}

/** Builds an SVG path `d` attribute for a simple line chart, normalized to fit the given viewport. */
export function buildLinePath(
  values: number[],
  { width, height, padding = 8 }: LinePathOptions,
): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid div-by-zero when every value is equal

  const points = values.map((value, i) => {
    const x =
      values.length === 1
        ? width / 2
        : padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return `M${points.join(" L")}`;
}
