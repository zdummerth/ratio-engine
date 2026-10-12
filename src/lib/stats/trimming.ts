import { quantileSorted, sortAscending } from './descriptive';

export interface TrimOptions {
  /** IQR multiplier for the fences. */
  multiplier: number;
  /** Samples smaller than this are returned untrimmed. */
  minimumSampleSize: number;
}

export const DEFAULT_TRIM_OPTIONS: TrimOptions = {
  multiplier: 1.5,
  minimumSampleSize: 10,
};

export interface TrimResult<T> {
  applied: boolean;
  /** Items inside the fences, in their original order. */
  kept: T[];
  /** Items outside the fences, in their original order. */
  excluded: T[];
  lowerFence: number | null;
  upperFence: number | null;
}

/** IQR outlier trimming on `ratio` (see docs/methodology.md §4). */
export function trimOutliersIqr<T extends { ratio: number }>(
  items: readonly T[],
  options: TrimOptions = DEFAULT_TRIM_OPTIONS,
): TrimResult<T> {
  if (items.length < options.minimumSampleSize) {
    return { applied: false, kept: [...items], excluded: [], lowerFence: null, upperFence: null };
  }

  const sorted = sortAscending(items.map((item) => item.ratio));
  const q1 = quantileSorted(sorted, 0.25);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - options.multiplier * iqr;
  const upperFence = q3 + options.multiplier * iqr;

  const kept: T[] = [];
  const excluded: T[] = [];
  for (const item of items) {
    if (item.ratio < lowerFence || item.ratio > upperFence) {
      excluded.push(item);
    } else {
      kept.push(item);
    }
  }
  return { applied: true, kept, excluded, lowerFence, upperFence };
}
