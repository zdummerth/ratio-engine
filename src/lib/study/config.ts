import { isIsoDate } from '../dates';
import { isPropertyClass, PROPERTY_CLASSES, type PropertyClass } from '../types';

export interface StudyConfig {
  taxYear: number;
  /** Inclusive, YYYY-MM-DD. */
  periodStart: string;
  /** Inclusive, YYYY-MM-DD. */
  periodEnd: string;
  propertyClass: PropertyClass;
}

export class StudyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudyConfigError';
  }
}

/** Throws StudyConfigError when the configuration cannot produce a valid study. */
export function validateStudyConfig(config: StudyConfig): void {
  if (!Number.isInteger(config.taxYear) || config.taxYear < 1900 || config.taxYear > 2100) {
    throw new StudyConfigError('taxYear must be a four-digit year');
  }
  if (!isIsoDate(config.periodStart)) {
    throw new StudyConfigError('the study period start must be a date in YYYY-MM-DD format');
  }
  if (!isIsoDate(config.periodEnd)) {
    throw new StudyConfigError('the study period end must be a date in YYYY-MM-DD format');
  }
  if (config.periodStart > config.periodEnd) {
    throw new StudyConfigError('the study period start must be on or before its end');
  }
  if (!isPropertyClass(config.propertyClass)) {
    throw new StudyConfigError(`property class must be one of ${PROPERTY_CLASSES.join(', ')}`);
  }
}

export type ParseStudyParamsResult = { ok: true; config: StudyConfig } | { ok: false; error: string };

/** Defaults used by the dashboard when a query parameter is missing. */
export const DEFAULT_STUDY_PARAMS = {
  taxYear: '2026',
  start: '2024-01-01',
  end: '2025-12-31',
  class: 'RES',
} as const;

/**
 * Parses `/api/studies` query parameters: `taxYear`, `start`, `end`, `class`.
 * All are required.
 */
export function parseStudyParams(params: URLSearchParams): ParseStudyParamsResult {
  for (const name of ['taxYear', 'start', 'end', 'class']) {
    if (!params.get(name)) return { ok: false, error: `${name} is required` };
  }
  const taxYearText = params.get('taxYear')!;
  if (!/^\d{4}$/.test(taxYearText)) {
    return { ok: false, error: 'taxYear must be a four-digit year' };
  }
  const classText = params.get('class')!;
  if (!isPropertyClass(classText)) {
    return { ok: false, error: `class must be one of ${PROPERTY_CLASSES.join(', ')}` };
  }

  const config: StudyConfig = {
    taxYear: Number(taxYearText),
    periodStart: params.get('start')!,
    periodEnd: params.get('end')!,
    propertyClass: classText,
  };
  try {
    validateStudyConfig(config);
  } catch (error) {
    if (error instanceof StudyConfigError) return { ok: false, error: error.message };
    throw error;
  }
  return { ok: true, config };
}
