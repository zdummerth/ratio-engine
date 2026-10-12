import type { Db } from '../db/connection';
import { listNeighborhoods } from '../repos/neighborhoodsRepo';
import { findQualifiedSales } from '../repos/salesRepo';
import { computeRatioStatistics } from '../stats/ratioStatistics';
import { trimOutliersIqr, type TrimResult } from '../stats/trimming';
import type { PropertyClass, RatioObservation } from '../types';
import { compareCodes, groupBy } from '../util/groupBy';
import { evaluateCompliance, type ComplianceResult } from './compliance';
import { validateStudyConfig, type StudyConfig } from './config';
import { toObservations } from './observations';
import { toReportedStatistics, type ReportedStatistics } from './reporting';
import { PERFORMANCE_STANDARDS, type PerformanceStandard } from './standards';

export type StudyGrouping = 'neighborhood';

export const OVERALL_STRATUM_KEY = 'ALL';

export interface StratumTrimming {
  applied: boolean;
  excludedCount: number;
  excludedSaleIds: string[];
  lowerFence: number | null;
  upperFence: number | null;
}

export interface StratumResult {
  key: string;
  label: string;
  /** Qualified sales in the stratum before trimming. */
  salesCount: number;
  trimming: StratumTrimming;
  /** Null only when the stratum has no sales. */
  statistics: ReportedStatistics | null;
  compliance: ComplianceResult;
}

export interface StudyResult {
  taxYear: number;
  periodStart: string;
  periodEnd: string;
  propertyClass: PropertyClass;
  groupBy: StudyGrouping;
  overall: StratumResult;
  strata: StratumResult[];
}

/** Runs a single-class ratio study stratified by neighborhood. */
export function runStudy(db: Db, config: StudyConfig): StudyResult {
  validateStudyConfig(config);

  const sales = findQualifiedSales(db, {
    taxYear: config.taxYear,
    periodStart: config.periodStart,
    periodEnd: config.periodEnd,
    propertyClasses: [config.propertyClass],
  });
  const observations = toObservations(sales);
  const trim = trimOutliersIqr(observations);
  const standard = PERFORMANCE_STANDARDS[config.propertyClass];
  const names = new Map(listNeighborhoods(db).map((n) => [n.code, n.name]));

  const overall = buildStratum(OVERALL_STRATUM_KEY, 'All neighborhoods', observations, trim, standard);
  const strata = [...groupBy(observations, (o) => o.neighborhood)]
    .sort(([a], [b]) => compareCodes(a, b))
    .map(([code, group]) => buildStratum(code, names.get(code) ?? code, group, trim, standard));

  return {
    taxYear: config.taxYear,
    periodStart: config.periodStart,
    periodEnd: config.periodEnd,
    propertyClass: config.propertyClass,
    groupBy: 'neighborhood',
    overall,
    strata,
  };
}

/** Summarizes one stratum, using the study-wide trim to decide which of its sales are kept. */
function buildStratum(
  key: string,
  label: string,
  observations: readonly RatioObservation[],
  trim: TrimResult<RatioObservation>,
  standard: PerformanceStandard,
): StratumResult {
  const inStratum = new Set(observations.map((o) => o.saleId));
  const kept = trim.kept.filter((o) => inStratum.has(o.saleId));
  const excluded = trim.excluded.filter((o) => inStratum.has(o.saleId));
  const statistics = kept.length > 0 ? toReportedStatistics(computeRatioStatistics(kept)) : null;

  return {
    key,
    label,
    salesCount: observations.length,
    trimming: {
      applied: trim.applied,
      excludedCount: excluded.length,
      excludedSaleIds: excluded.map((o) => o.saleId),
      lowerFence: trim.lowerFence,
      upperFence: trim.upperFence,
    },
    statistics,
    compliance: evaluateCompliance(statistics, standard),
  };
}
