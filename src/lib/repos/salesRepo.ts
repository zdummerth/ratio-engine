import type { Db } from '../db/connection';
import type { PropertyClass, SaleRecord } from '../types';

export interface QualifiedSalesQuery {
  taxYear: number;
  /** Inclusive, YYYY-MM-DD. */
  periodStart: string;
  /** Inclusive, YYYY-MM-DD. */
  periodEnd: string;
  /** Restrict to these classes; all classes when omitted or empty. */
  propertyClasses?: readonly PropertyClass[];
  /** Restrict to these neighborhood codes; all neighborhoods when omitted or empty. */
  neighborhoods?: readonly string[];
}

/**
 * Qualified sales recorded within the study period, each paired with its
 * parcel's assessed value for the study tax year (see docs/methodology.md §1).
 */
export function findQualifiedSales(db: Db, query: QualifiedSalesQuery): SaleRecord[] {
  const params: Record<string, string | number> = {
    taxYear: query.taxYear,
    periodStart: query.periodStart,
    periodEnd: query.periodEnd,
  };
  const where = [`s.validity_code = 'Q'`, `s.recorded_at BETWEEN @periodStart AND @periodEnd`];

  if (query.propertyClasses && query.propertyClasses.length > 0) {
    where.push(`p.property_class IN (${bindList(params, 'class', query.propertyClasses)})`);
  }
  if (query.neighborhoods && query.neighborhoods.length > 0) {
    where.push(`p.neighborhood_code IN (${bindList(params, 'nbhd', query.neighborhoods)})`);
  }

  const sql = `
    SELECT s.sale_id           AS saleId,
           s.parcel_id         AS parcelId,
           p.neighborhood_code AS neighborhood,
           p.property_class    AS propertyClass,
           s.recorded_at       AS recordedAt,
           s.sale_price        AS salePrice,
           a.assessed_value    AS assessedValue
      FROM sales s
      JOIN parcels p     ON p.parcel_id = s.parcel_id
      JOIN assessments a ON a.parcel_id = s.parcel_id AND a.tax_year = @taxYear
     WHERE ${where.join('\n       AND ')}
     ORDER BY s.recorded_at, s.sale_id`;

  return db.prepare(sql).all(params) as unknown as SaleRecord[];
}

function bindList(params: Record<string, string | number>, prefix: string, values: readonly string[]): string {
  return values
    .map((value, index) => {
      const name = `${prefix}${index}`;
      params[name] = value;
      return `@${name}`;
    })
    .join(', ');
}
