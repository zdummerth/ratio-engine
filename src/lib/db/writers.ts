import type { PropertyClass } from '../types';
import type { Db } from './connection';

export type NewParcel = {
  parcelId: string;
  neighborhood: string;
  propertyClass: PropertyClass;
  situsAddress: string;
  yearBuilt: number | null;
};

export type NewAssessment = {
  parcelId: string;
  taxYear: number;
  assessedValue: number;
};

export type NewSale = {
  saleId: string;
  parcelId: string;
  recordedAt: string;
  salePrice: number;
  validityCode: string;
};

export function insertNeighborhood(db: Db, neighborhood: { code: string; name: string }): void {
  db.prepare('INSERT INTO neighborhoods (code, name) VALUES (@code, @name)').run(neighborhood);
}

export function insertParcel(db: Db, parcel: NewParcel): void {
  db.prepare(
    `INSERT INTO parcels (parcel_id, neighborhood_code, property_class, situs_address, year_built)
     VALUES (@parcelId, @neighborhood, @propertyClass, @situsAddress, @yearBuilt)`,
  ).run(parcel);
}

export function insertAssessment(db: Db, assessment: NewAssessment): void {
  db.prepare(
    `INSERT INTO assessments (parcel_id, tax_year, assessed_value)
     VALUES (@parcelId, @taxYear, @assessedValue)`,
  ).run(assessment);
}

export function insertSale(db: Db, sale: NewSale): void {
  db.prepare(
    `INSERT INTO sales (sale_id, parcel_id, recorded_at, sale_price, validity_code)
     VALUES (@saleId, @parcelId, @recordedAt, @salePrice, @validityCode)`,
  ).run(sale);
}
