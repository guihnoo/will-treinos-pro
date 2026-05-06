/** SVG sparkline computation — extract numerical trend to paths + metadata */

export interface SparklineData {
  d: string;        // SVG stroke path "M x y L x y..."
  areaD: string;    // Closed area path for fill
  w: number;        // viewBox width
  h: number;        // viewBox height
  min: number;      // min value (padded)
  max: number;      // max value (padded)
  trend: "up" | "down" | "flat";
}

/**
 * Convert array of numbers into SVG paths + trend direction.
 * Pads min/max for visual breathing room, normalizes to 0–1, maps to pixel space.
 * @param points numerical values in chronological order
 * @param w svg viewBox width (pixels)
 * @param h svg viewBox height (pixels)
 * @returns stroke + area paths, normalized min/max, trend direction
 */
export function computeSparkline(points: number[], w = 240, h = 48): SparklineData | null {
  if (points.length < 2) return null;

  const filtered = points.filter((p) => typeof p === "number");
  if (filtered.length < 2) return null;

  // Normalize: find min/max, pad for breathing room
  const minVal = Math.min(...filtered);
  const maxVal = Math.max(...filtered);
  const pad = 0.75;
  const lo = Math.max(0, minVal - pad);
  const hi = Math.min(Infinity, maxVal + pad);
  const span = Math.max(0.0001, hi - lo);

  // Pixel mapping: account for padding
  const padX = 8;
  const padY = 6;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  // Compute pixel coordinates for each point
  const linePts = filtered.map((val, i) => {
    const x = padX + (innerW * i) / Math.max(1, filtered.length - 1);
    const y = padY + innerH * (1 - (val - lo) / span);
    return { x, y, val };
  });

  // SVG stroke path
  const d = linePts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // SVG area path (closed for gradient fill)
  const areaD = `M ${linePts[0]!.x.toFixed(1)} ${(h - padY).toFixed(1)} ${linePts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} L ${linePts[linePts.length - 1]!.x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;

  // Trend direction: last vs first
  const first = filtered[0]!;
  const last = filtered[filtered.length - 1]!;
  const trend = last > first + 0.5 ? "up" : last < first - 0.5 ? "down" : "flat";

  return { d, areaD, w, h, min: lo, max: hi, trend };
}
