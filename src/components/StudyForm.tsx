import { PROPERTY_CLASSES, PROPERTY_CLASS_LABELS } from '@/lib/types';

export interface StudyFormValues {
  taxYear: string;
  start: string;
  end: string;
  class: string;
}

/** Plain GET form; the page re-renders from the query string. */
export function StudyForm({ values }: { values: StudyFormValues }) {
  return (
    <form className="study-form" method="get">
      <label>
        Tax year
        <input name="taxYear" type="number" min={1900} max={2100} defaultValue={values.taxYear} />
      </label>
      <label>
        Period start
        <input name="start" type="date" defaultValue={values.start} />
      </label>
      <label>
        Period end
        <input name="end" type="date" defaultValue={values.end} />
      </label>
      <label>
        Property class
        <select name="class" defaultValue={values.class}>
          {PROPERTY_CLASSES.map((code) => (
            <option key={code} value={code}>
              {PROPERTY_CLASS_LABELS[code]} ({code})
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Run study</button>
    </form>
  );
}
