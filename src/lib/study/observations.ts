import { roundTo } from '../stats/rounding';
import type { RatioObservation, SaleRecord } from '../types';

/** Attaches the sales ratio (assessed value / sale price) to each sale. */
export function toObservations(sales: readonly SaleRecord[]): RatioObservation[] {
  return sales.map((sale) => ({
    ...sale,
    ratio: roundTo(sale.assessedValue / sale.salePrice, 2),
  }));
}
