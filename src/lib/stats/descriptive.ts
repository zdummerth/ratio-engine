function assertNonEmpty(values: readonly number[], name: string): void {
  if (values.length === 0) {
    throw new RangeError(`${name} requires at least one value`);
  }
}

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

export function mean(values: readonly number[]): number {
  assertNonEmpty(values, 'mean');
  return sum(values) / values.length;
}

export function sortAscending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function median(values: readonly number[]): number {
  assertNonEmpty(values, 'median');
  const sorted = sortAscending(values);
  return sorted[Math.floor(sorted.length / 2)]!;
}

/**
 * Quantile of an ascending-sorted array using linear interpolation between
 * closest ranks (the method used by Excel's QUARTILE.INC).
 */
export function quantileSorted(sorted: readonly number[], p: number): number {
  assertNonEmpty(sorted, 'quantile');
  if (p < 0 || p > 1) {
    throw new RangeError(`quantile proportion must be between 0 and 1, got ${p}`);
  }
  const h = (sorted.length - 1) * p;
  const lower = Math.floor(h);
  const upper = Math.ceil(h);
  const a = sorted[lower]!;
  const b = sorted[upper]!;
  return a + (h - lower) * (b - a);
}
