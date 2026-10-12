import { openDatabase, type Db } from '@/lib/db/connection';
import { insertAssessment, insertNeighborhood, insertParcel, insertSale } from '@/lib/db/writers';
import type { PropertyClass } from '@/lib/types';

export interface FixtureSale {
  neighborhood: string;
  propertyClass?: PropertyClass;
  recordedAt: string;
  salePrice: number;
  /** Assessed value for `taxYear` (default 2026). Pass null to omit the assessment. */
  assessedValue: number | null;
  taxYear?: number;
  validityCode?: string;
}

/** Small in-memory database for tests; each sale gets its own parcel. */
export class FixtureDb {
  readonly db: Db = openDatabase(':memory:');
  private parcelSequence = 0;
  private saleSequence = 0;
  private readonly knownNeighborhoods = new Set<string>();

  neighborhood(code: string, name = `Neighborhood ${code}`): this {
    if (!this.knownNeighborhoods.has(code)) {
      insertNeighborhood(this.db, { code, name });
      this.knownNeighborhoods.add(code);
    }
    return this;
  }

  addSale(sale: FixtureSale): { saleId: string; parcelId: string } {
    this.neighborhood(sale.neighborhood);
    this.parcelSequence += 1;
    this.saleSequence += 1;
    const parcelId = `P${String(this.parcelSequence).padStart(5, '0')}`;
    const saleId = `S${String(this.saleSequence).padStart(5, '0')}`;

    insertParcel(this.db, {
      parcelId,
      neighborhood: sale.neighborhood,
      propertyClass: sale.propertyClass ?? 'RES',
      situsAddress: `${this.parcelSequence} Test St`,
      yearBuilt: 2000,
    });
    if (sale.assessedValue !== null) {
      insertAssessment(this.db, {
        parcelId,
        taxYear: sale.taxYear ?? 2026,
        assessedValue: sale.assessedValue,
      });
    }
    insertSale(this.db, {
      saleId,
      parcelId,
      recordedAt: sale.recordedAt,
      salePrice: sale.salePrice,
      validityCode: sale.validityCode ?? 'Q',
    });
    return { saleId, parcelId };
  }
}
