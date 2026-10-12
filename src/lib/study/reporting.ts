import type { RatioStatistics } from '../stats/ratioStatistics';
import { roundTo } from '../stats/rounding';

/** Statistics as published: rounded once, at the end (docs/methodology.md §6). */
export interface ReportedStatistics {
  count: number;
  median: number;
  mean: number;
  weightedMean: number;
  cod: number;
  prd: number;
  prb: number | null;
}

export const RATIO_DECIMALS = 4;
export const COD_DECIMALS = 2;

export function toReportedStatistics(stats: RatioStatistics): ReportedStatistics {
  return {
    count: stats.count,
    median: roundTo(stats.median, RATIO_DECIMALS),
    mean: roundTo(stats.mean, RATIO_DECIMALS),
    weightedMean: roundTo(stats.weightedMean, RATIO_DECIMALS),
    cod: roundTo(stats.cod, COD_DECIMALS),
    prd: roundTo(stats.prd, RATIO_DECIMALS),
    prb: stats.prb === null ? null : roundTo(stats.prb, RATIO_DECIMALS),
  };
}
