import { mean, median, sum } from './descriptive';

export interface RatioInput {
  ratio: number;
  assessedValue: number;
  salePrice: number;
}

export interface RatioStatistics {
  count: number;
  median: number;
  mean: number;
  weightedMean: number;
  /** Coefficient of dispersion, as a percentage. */
  cod: number;
  /** Price-related differential. */
  prd: number;
  /** Price-related bias; null when it cannot be computed. */
  prb: number | null;
}

/** Computes ratio study statistics at full precision (see docs/methodology.md §5). */
export function computeRatioStatistics(items: readonly RatioInput[]): RatioStatistics {
  if (items.length === 0) {
    throw new RangeError('ratio statistics require at least one sale');
  }
  const ratios = items.map((item) => item.ratio);
  const med = median(ratios);
  const avg = mean(ratios);
  const weightedMean = sum(items.map((item) => item.assessedValue)) / sum(items.map((item) => item.salePrice));
  const cod = (100 * mean(ratios.map((ratio) => Math.abs(ratio - med)))) / med;
  const prd = avg / weightedMean;

  return {
    count: items.length,
    median: med,
    mean: avg,
    weightedMean,
    cod,
    prd,
    prb: priceRelatedBias(items, med),
  };
}

/** Slope of percentage difference from the median on log2 of the value proxy. */
export function priceRelatedBias(items: readonly RatioInput[], med: number): number | null {
  if (items.length < 2) return null;

  const xs = items.map((item) => Math.log(0.5 * item.salePrice + 0.5 * (item.assessedValue / med)) / Math.LN2);
  const ys = items.map((item) => (item.ratio - med) / med);
  const xBar = mean(xs);
  const yBar = mean(ys);

  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const dx = xs[i]! - xBar;
    sxy += dx * (ys[i]! - yBar);
    sxx += dx * dx;
  }
  if (sxx < 1e-12) return null;
  return sxy / sxx;
}
