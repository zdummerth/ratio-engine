import { StrataTable } from '@/components/StrataTable';
import { StudyForm, type StudyFormValues } from '@/components/StudyForm';
import { getDb } from '@/lib/db/client';
import { DEFAULT_STUDY_PARAMS, parseStudyParams } from '@/lib/study/config';
import { runStudy } from '@/lib/study/runStudy';
import { PROPERTY_CLASS_LABELS } from '@/lib/types';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function StudyPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const values = { ...DEFAULT_STUDY_PARAMS } as StudyFormValues;
  for (const name of Object.keys(DEFAULT_STUDY_PARAMS) as (keyof StudyFormValues)[]) {
    const value = raw[name];
    if (typeof value === 'string' && value !== '') values[name] = value;
  }

  const parsed = parseStudyParams(new URLSearchParams({ ...values }));
  const result = parsed.ok ? runStudy(getDb(), parsed.config) : null;

  return (
    <>
      <StudyForm values={values} />
      {!parsed.ok && <p className="error">{parsed.error}</p>}
      {result && (
        <section>
          <h1>
            {PROPERTY_CLASS_LABELS[result.propertyClass]} ratio study, tax year {result.taxYear}
          </h1>
          <p className="study-meta">
            Qualified sales recorded {result.periodStart} through {result.periodEnd}, by neighborhood.
            Outliers trimmed with 1.5 × IQR within each stratum. Highlighted values are outside the
            adopted performance standard.
          </p>
          <StrataTable overall={result.overall} strata={result.strata} />
        </section>
      )}
    </>
  );
}
