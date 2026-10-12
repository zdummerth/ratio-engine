import type { PropertyClass } from '../types';

/** Inclusive bounds; null means unbounded on that side. */
export interface Bounds {
  min: number | null;
  max: number | null;
}

export interface PerformanceStandard {
  level: Bounds;
  cod: Bounds;
  prd: Bounds;
  prb: Bounds;
}

const LEVEL: Bounds = { min: 0.9, max: 1.1 };
const PRD: Bounds = { min: 0.98, max: 1.03 };
const PRB: Bounds = { min: -0.05, max: 0.05 };

/** Adopted performance standards by property class (docs/methodology.md §7). */
export const PERFORMANCE_STANDARDS: Record<PropertyClass, PerformanceStandard> = {
  RES: { level: LEVEL, cod: { min: null, max: 15 }, prd: PRD, prb: PRB },
  CON: { level: LEVEL, cod: { min: null, max: 15 }, prd: PRD, prb: PRB },
  COM: { level: LEVEL, cod: { min: null, max: 20 }, prd: PRD, prb: PRB },
  VAC: { level: LEVEL, cod: { min: null, max: 25 }, prd: PRD, prb: PRB },
};

/** Strata with fewer sales than this after trimming are not evaluated. */
export const MIN_SALES_FOR_COMPLIANCE = 5;
