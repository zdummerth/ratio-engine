import { describe, expect, it } from 'vitest';
import { DEFAULT_TRIM_OPTIONS, trimOutliersIqr } from '@/lib/stats/trimming';

const withRatios = (ratios: number[]) => ratios.map((ratio, index) => ({ id: index, ratio }));

describe('trimOutliersIqr', () => {
  it('uses a 1.5 x IQR fence and a minimum sample of 10 by default', () => {
    expect(DEFAULT_TRIM_OPTIONS).toEqual({ multiplier: 1.5, minimumSampleSize: 10 });
  });

  it('removes ratios outside the fences', () => {
    const items = withRatios([0.9, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 1.0, 1.02, 1.6]);
    const result = trimOutliersIqr(items);

    expect(result.applied).toBe(true);
    // Q1 = 0.9425, Q3 = 0.995, IQR = 0.0525
    expect(result.lowerFence).toBeCloseTo(0.86375, 10);
    expect(result.upperFence).toBeCloseTo(1.07375, 10);
    expect(result.excluded.map((i) => i.ratio)).toEqual([1.6]);
    expect(result.kept).toHaveLength(9);
  });

  it('keeps ratios that sit exactly on a fence', () => {
    // Q1 = Q3 = 1.0, so both fences are 1.0.
    const items = withRatios([0.8, 1, 1, 1, 1, 1, 1, 1, 1, 1.2]);
    const result = trimOutliersIqr(items);

    expect(result.lowerFence).toBe(1);
    expect(result.upperFence).toBe(1);
    expect(result.kept.map((i) => i.ratio)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    expect(result.excluded.map((i) => i.ratio)).toEqual([0.8, 1.2]);
  });

  it('preserves input order in kept and excluded', () => {
    const items = withRatios([1.6, 0.98, 0.9, 1.02, 0.94, 0.97, 0.95, 1.0, 0.92, 0.96]);
    const result = trimOutliersIqr(items);
    expect(result.kept.map((i) => i.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.excluded.map((i) => i.id)).toEqual([0]);
  });

  it('does not trim samples smaller than the minimum', () => {
    const items = withRatios([0.9, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 1.0, 3.5]);
    const result = trimOutliersIqr(items);

    expect(result.applied).toBe(false);
    expect(result.kept).toHaveLength(9);
    expect(result.excluded).toHaveLength(0);
    expect(result.lowerFence).toBeNull();
    expect(result.upperFence).toBeNull();
  });

  it('accepts custom options', () => {
    const items = withRatios([0.9, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 1.0, 1.02, 1.1]);
    expect(trimOutliersIqr(items).excluded.map((i) => i.ratio)).toEqual([1.1]);
    expect(trimOutliersIqr(items, { multiplier: 3, minimumSampleSize: 10 }).excluded).toHaveLength(0);
  });
});
