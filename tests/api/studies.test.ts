import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/studies/route';
import type { StudyResult } from '@/lib/study/runStudy';

// vitest.config.ts sets DATABASE_PATH=:memory:, so getDb() returns a freshly seeded database.

function request(query: string): Request {
  return new Request(`http://localhost/api/studies?${query}`);
}

describe('GET /api/studies', () => {
  it('returns a study for valid parameters', async () => {
    const response = GET(request('taxYear=2026&start=2024-01-01&end=2025-12-31&class=RES'));
    expect(response.status).toBe(200);

    const body = (await response.json()) as StudyResult;
    expect(body.groupBy).toBe('neighborhood');
    expect(body.propertyClass).toBe('RES');
    expect(body.overall.key).toBe('ALL');
    expect(body.overall.salesCount).toBe(body.strata.reduce((n, s) => n + s.salesCount, 0));

    const keys = body.strata.map((s) => s.key);
    expect(keys).toEqual([...keys].sort());
    expect(keys.length).toBeGreaterThan(3);
  });

  it('responds 400 with a message for missing parameters', async () => {
    const response = GET(request('taxYear=2026&start=2024-01-01&end=2025-12-31'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'class is required' });
  });

  it('responds 400 for an inverted period', async () => {
    const response = GET(request('taxYear=2026&start=2025-01-01&end=2024-12-31&class=RES'));
    expect(response.status).toBe(400);
  });
});
