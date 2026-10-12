import { beforeEach, describe, expect, it } from 'vitest';
import { StudyConfigError } from '@/lib/study/config';
import { runStudy } from '@/lib/study/runStudy';
import { FixtureDb } from '../helpers/fixtureDb';

const config = { taxYear: 2026, periodStart: '2024-01-01', periodEnd: '2025-12-31', propertyClass: 'RES' as const };

describe('runStudy', () => {
  let fx: FixtureDb;

  beforeEach(() => {
    fx = new FixtureDb();
    fx.neighborhood('N1', 'Southside').neighborhood('N2', 'Northside').neighborhood('N3', 'Downtown');

    // Northside: ratios 0.95, 0.90, 1.00, 1.05, 1.10
    for (const [av, price] of [
      [95_000, 100_000],
      [180_000, 200_000],
      [300_000, 300_000],
      [210_000, 200_000],
      [440_000, 400_000],
    ] as const) {
      fx.addSale({ neighborhood: 'N2', recordedAt: '2025-02-10T10:00:00', salePrice: price, assessedValue: av });
    }
    fx.addSale({ neighborhood: 'N2', recordedAt: '2025-02-11T10:00:00', salePrice: 100_000, assessedValue: 300_000, validityCode: 'U1' });

    // Southside: ratios 0.97, 1.00, 1.03
    for (const [av, price] of [
      [194_000, 200_000],
      [250_000, 250_000],
      [309_000, 300_000],
    ] as const) {
      fx.addSale({ neighborhood: 'N1', recordedAt: '2024-07-01T09:00:00', salePrice: price, assessedValue: av });
    }

    // Downtown has only a commercial sale.
    fx.addSale({ neighborhood: 'N3', propertyClass: 'COM', recordedAt: '2024-05-05T12:00:00', salePrice: 1_000_000, assessedValue: 950_000 });
  });

  it('reports one stratum per neighborhood with sales of the class, ordered by code', () => {
    const result = runStudy(fx.db, config);
    expect(result.groupBy).toBe('neighborhood');
    expect(result.propertyClass).toBe('RES');
    expect(result.strata.map((s) => [s.key, s.label, s.salesCount])).toEqual([
      ['N1', 'Southside', 3],
      ['N2', 'Northside', 5],
    ]);
  });

  it('computes the overall stratum from the whole sample', () => {
    const { overall } = runStudy(fx.db, config);
    expect(overall.key).toBe('ALL');
    expect(overall.label).toBe('All neighborhoods');
    expect(overall.salesCount).toBe(8);
    expect(overall.trimming.applied).toBe(false);
    expect(overall.statistics?.median).toBe(1);
  });

  it('reports rounded statistics and evaluates them against the class standard', () => {
    const northside = runStudy(fx.db, config).strata.find((s) => s.key === 'N2')!;
    expect(northside.statistics).toEqual({
      count: 5,
      median: 1,
      mean: 1,
      weightedMean: 1.0208,
      cod: 6,
      prd: 0.9796,
      prb: 0.0672,
    });
    expect(northside.compliance.status).toBe('FAIL');
    expect(northside.compliance.checks.filter((c) => !c.passed).map((c) => c.measure)).toEqual(['prd', 'prb']);
  });

  it('marks strata with fewer than 5 sales as insufficient', () => {
    const southside = runStudy(fx.db, config).strata.find((s) => s.key === 'N1')!;
    expect(southside.compliance).toEqual({ status: 'INSUFFICIENT_SAMPLE', checks: [] });
    expect(southside.statistics?.count).toBe(3);
  });

  it('returns an empty study when no sales fall in the period', () => {
    const result = runStudy(fx.db, { ...config, periodStart: '2022-01-01', periodEnd: '2022-12-31' });
    expect(result.strata).toEqual([]);
    expect(result.overall.salesCount).toBe(0);
    expect(result.overall.statistics).toBeNull();
    expect(result.overall.compliance.status).toBe('INSUFFICIENT_SAMPLE');
  });

  it('rejects an invalid configuration', () => {
    expect(() => runStudy(fx.db, { ...config, periodStart: '2026-01-01' })).toThrow(StudyConfigError);
  });
});
