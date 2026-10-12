import { getDb } from '@/lib/db/client';
import { parseStudyParams } from '@/lib/study/config';
import { runStudy } from '@/lib/study/runStudy';

/**
 * GET /api/studies?taxYear=2026&start=2024-01-01&end=2025-12-31&class=RES
 *
 * Returns a StudyResult as JSON, or 400 with `{ error }` for invalid parameters.
 */
export function GET(request: Request): Response {
  const parsed = parseStudyParams(new URL(request.url).searchParams);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  return Response.json(runStudy(getDb(), parsed.config));
}
