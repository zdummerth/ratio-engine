import { describe, expect, it } from 'vitest';
import { parseStudyParams, StudyConfigError, validateStudyConfig } from '@/lib/study/config';

const valid = { taxYear: '2026', start: '2024-01-01', end: '2025-12-31', class: 'RES' };

function parse(overrides: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries({ ...valid, ...overrides })) {
    if (value !== undefined) params.set(name, value);
  }
  return parseStudyParams(params);
}

describe('parseStudyParams', () => {
  it('builds a study config from query parameters', () => {
    expect(parse()).toEqual({
      ok: true,
      config: { taxYear: 2026, periodStart: '2024-01-01', periodEnd: '2025-12-31', propertyClass: 'RES' },
    });
  });

  it.each(['taxYear', 'start', 'end', 'class'])('requires %s', (name) => {
    expect(parse({ [name]: undefined })).toEqual({ ok: false, error: `${name} is required` });
  });

  it('rejects a malformed tax year', () => {
    expect(parse({ taxYear: '26' })).toEqual({ ok: false, error: 'taxYear must be a four-digit year' });
  });

  it('rejects an unknown property class', () => {
    expect(parse({ class: 'IND' })).toEqual({ ok: false, error: 'class must be one of RES, CON, COM, VAC' });
  });

  it('rejects dates that are not real calendar dates', () => {
    const result = parse({ end: '2025-02-30' });
    expect(result.ok).toBe(false);
  });

  it('rejects a period that ends before it starts', () => {
    const result = parse({ start: '2025-06-01', end: '2025-05-31' });
    expect(result).toEqual({ ok: false, error: 'the study period start must be on or before its end' });
  });

  it('allows a single-day period', () => {
    expect(parse({ start: '2025-06-01', end: '2025-06-01' }).ok).toBe(true);
  });
});

describe('validateStudyConfig', () => {
  it('throws StudyConfigError for an invalid class', () => {
    expect(() =>
      validateStudyConfig({
        taxYear: 2026,
        periodStart: '2024-01-01',
        periodEnd: '2025-12-31',
        propertyClass: 'XYZ' as never,
      }),
    ).toThrow(StudyConfigError);
  });
});
