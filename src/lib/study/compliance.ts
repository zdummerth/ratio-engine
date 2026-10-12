import type { ReportedStatistics } from './reporting';
import { MIN_SALES_FOR_COMPLIANCE, type Bounds, type PerformanceStandard } from './standards';

export type ComplianceStatus = 'PASS' | 'FAIL' | 'INSUFFICIENT_SAMPLE';

export type Measure = 'level' | 'cod' | 'prd' | 'prb';

export interface ComplianceCheck {
  measure: Measure;
  value: number;
  min: number | null;
  max: number | null;
  passed: boolean;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  checks: ComplianceCheck[];
}

/**
 * Evaluates reported (already rounded) statistics against a performance
 * standard (docs/methodology.md §7). `stats` is null when the stratum has no sales.
 */
export function evaluateCompliance(stats: ReportedStatistics | null, standard: PerformanceStandard): ComplianceResult {
  if (stats === null || stats.count < MIN_SALES_FOR_COMPLIANCE) {
    return { status: 'INSUFFICIENT_SAMPLE', checks: [] };
  }

  const checks: ComplianceCheck[] = [
    check('level', stats.median, standard.level),
    check('cod', stats.cod, standard.cod),
    check('prd', stats.prd, standard.prd),
  ];
  if (stats.prb !== null) {
    checks.push(check('prb', stats.prb, standard.prb));
  }

  return {
    status: checks.every((c) => c.passed) ? 'PASS' : 'FAIL',
    checks,
  };
}

function check(measure: Measure, value: number, bounds: Bounds): ComplianceCheck {
  const aboveMin = bounds.min === null || value >= bounds.min;
  const belowMax = bounds.max === null || value <= bounds.max;
  return { measure, value, min: bounds.min, max: bounds.max, passed: aboveMin && belowMax };
}
