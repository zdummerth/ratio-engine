import { describe, expect, it } from 'vitest';
import { mean, median, quantileSorted, sortAscending, sum } from '@/lib/stats/descriptive';

describe('sum and mean', () => {
  it('adds and averages values', () => {
    expect(sum([1, 2, 3.5])).toBe(6.5);
    expect(sum([])).toBe(0);
    expect(mean([0.9, 1.0, 1.1])).toBeCloseTo(1.0, 12);
  });

  it('rejects an empty sample for mean', () => {
    expect(() => mean([])).toThrow(RangeError);
  });
});

describe('median', () => {
  it('returns the middle value of an unsorted sample', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1.02, 0.88, 0.97, 1.1, 0.93])).toBe(0.97);
  });

  it('handles a single value', () => {
    expect(median([0.95])).toBe(0.95);
  });

  it('does not reorder the input', () => {
    const values = [1.1, 0.9, 1.0];
    median(values);
    expect(values).toEqual([1.1, 0.9, 1.0]);
  });

  it('rejects an empty sample', () => {
    expect(() => median([])).toThrow(RangeError);
  });
});

describe('quantileSorted', () => {
  const sorted = sortAscending([4, 1, 3, 2]);

  it('interpolates between closest ranks like QUARTILE.INC', () => {
    expect(quantileSorted(sorted, 0.25)).toBeCloseTo(1.75, 12);
    expect(quantileSorted(sorted, 0.75)).toBeCloseTo(3.25, 12);
  });

  it('returns the extremes at p = 0 and p = 1', () => {
    expect(quantileSorted(sorted, 0)).toBe(1);
    expect(quantileSorted(sorted, 1)).toBe(4);
  });

  it('returns the only value of a single-element sample', () => {
    expect(quantileSorted([0.97], 0.75)).toBe(0.97);
  });

  it('rejects proportions outside [0, 1]', () => {
    expect(() => quantileSorted(sorted, 1.5)).toThrow(RangeError);
    expect(() => quantileSorted(sorted, -0.1)).toThrow(RangeError);
  });
});
