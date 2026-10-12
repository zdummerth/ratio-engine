import { describe, expect, it } from 'vitest';
import { evaluateCompliance } from '@/lib/study/compliance';
import type { ReportedStatistics } from '@/lib/study/reporting';
import { PERFORMANCE_STANDARDS } from '@/lib/study/standards';

function stats(overrides: Partial<ReportedStatistics> = {}): ReportedStatistics {
  return {
    count: 25,
    median: 0.98,
    mean: 0.99,
    weightedMean: 0.985,
    cod: 9.5,
    prd: 1.005,
    prb: 0.01,
    ...overrides,
  };
}

describe('evaluateCompliance', () => {
  it('passes when every measure is within the standard', () => {
    const result = evaluateCompliance(stats(), PERFORMANCE_STANDARDS.RES);
    expect(result.status).toBe('PASS');
    expect(result.checks.map((c) => c.measure)).toEqual(['level', 'cod', 'prd', 'prb']);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it('fails when any measure is out of range', () => {
    const result = evaluateCompliance(stats({ prd: 1.0301 }), PERFORMANCE_STANDARDS.RES);
    expect(result.status).toBe('FAIL');
    expect(result.checks.filter((c) => !c.passed).map((c) => c.measure)).toEqual(['prd']);
  });

  it('applies class-specific COD limits', () => {
    const highCod = stats({ cod: 18.4 });
    expect(evaluateCompliance(highCod, PERFORMANCE_STANDARDS.RES).status).toBe('FAIL');
    expect(evaluateCompliance(highCod, PERFORMANCE_STANDARDS.COM).status).toBe('PASS');
    expect(evaluateCompliance(stats({ cod: 24.9 }), PERFORMANCE_STANDARDS.VAC).status).toBe('PASS');
  });

  it('treats bounds as inclusive', () => {
    const atBounds = stats({ median: 0.9, cod: 15, prd: 1.03, prb: -0.05 });
    expect(evaluateCompliance(atBounds, PERFORMANCE_STANDARDS.RES).status).toBe('PASS');
    const atUpperLevel = stats({ median: 1.1, prd: 0.98, prb: 0.05 });
    expect(evaluateCompliance(atUpperLevel, PERFORMANCE_STANDARDS.RES).status).toBe('PASS');
  });

  it('skips the PRB check when PRB was not computed', () => {
    const result = evaluateCompliance(stats({ prb: null }), PERFORMANCE_STANDARDS.RES);
    expect(result.checks.map((c) => c.measure)).toEqual(['level', 'cod', 'prd']);
  });

  it('does not evaluate samples of fewer than 5 sales', () => {
    expect(evaluateCompliance(stats({ count: 4, median: 0.5 }), PERFORMANCE_STANDARDS.RES)).toEqual({
      status: 'INSUFFICIENT_SAMPLE',
      checks: [],
    });
    expect(evaluateCompliance(stats({ count: 5 }), PERFORMANCE_STANDARDS.RES).status).toBe('PASS');
  });

  it('treats a missing sample as insufficient', () => {
    expect(evaluateCompliance(null, PERFORMANCE_STANDARDS.RES).status).toBe('INSUFFICIENT_SAMPLE');
  });
});
