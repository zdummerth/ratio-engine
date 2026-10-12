import { describe, expect, it } from 'vitest';
import { computeRatioStatistics, type RatioInput } from '@/lib/stats/ratioStatistics';

function sale(assessedValue: number, salePrice: number): RatioInput {
  return { assessedValue, salePrice, ratio: assessedValue / salePrice };
}

describe('computeRatioStatistics', () => {
  // Ratios 0.95, 0.90, 1.00, 1.05, 1.10
  const sample = [
    sale(95_000, 100_000),
    sale(180_000, 200_000),
    sale(300_000, 300_000),
    sale(210_000, 200_000),
    sale(440_000, 400_000),
  ];

  it('computes level, uniformity, and vertical equity measures', () => {
    const stats = computeRatioStatistics(sample);
    expect(stats.count).toBe(5);
    expect(stats.median).toBeCloseTo(1.0, 12);
    expect(stats.mean).toBeCloseTo(1.0, 12);
    expect(stats.weightedMean).toBeCloseTo(1_225_000 / 1_200_000, 12);
    expect(stats.cod).toBeCloseTo(6.0, 10);
    expect(stats.prd).toBeCloseTo(0.979591836734694, 12);
    expect(stats.prb).toBeCloseTo(0.067173956132644, 10);
  });

  it('detects regressivity', () => {
    // Low-value parcels over-assessed, high-value parcels under-assessed.
    const stats = computeRatioStatistics([
      sale(120_000, 100_000),
      sale(220_000, 200_000),
      sale(300_000, 300_000),
      sale(360_000, 400_000),
      sale(400_000, 500_000),
    ]);
    expect(stats.cod).toBeCloseTo(12.0, 10);
    expect(stats.prd).toBeCloseTo(1.0714285714285714, 12);
    expect(stats.prb).toBeCloseTo(-0.188976534296604, 10);
  });

  it('reports PRB as null for a single sale', () => {
    expect(computeRatioStatistics([sale(95_000, 100_000)]).prb).toBeNull();
  });

  it('reports PRB as null when every value proxy is identical', () => {
    expect(computeRatioStatistics([sale(95_000, 100_000), sale(95_000, 100_000)]).prb).toBeNull();
  });

  it('rejects an empty sample', () => {
    expect(() => computeRatioStatistics([])).toThrow(RangeError);
  });
});
