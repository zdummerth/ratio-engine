import type { Db } from './connection';

/**
 * Validity codes used by the sales file:
 *   Q  - qualified, arm's-length sale
 *   U1 - sale between related parties
 *   U2 - foreclosure or bank-owned sale
 *   U3 - multi-parcel sale
 *   U4 - partial interest
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS neighborhoods (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parcels (
  parcel_id         TEXT PRIMARY KEY,
  neighborhood_code TEXT NOT NULL REFERENCES neighborhoods(code),
  property_class    TEXT NOT NULL CHECK (property_class IN ('RES', 'CON', 'COM', 'VAC')),
  situs_address     TEXT NOT NULL,
  year_built        INTEGER
);

CREATE TABLE IF NOT EXISTS assessments (
  parcel_id      TEXT NOT NULL REFERENCES parcels(parcel_id),
  tax_year       INTEGER NOT NULL,
  assessed_value INTEGER NOT NULL CHECK (assessed_value >= 0),
  PRIMARY KEY (parcel_id, tax_year)
);

CREATE TABLE IF NOT EXISTS sales (
  sale_id       TEXT PRIMARY KEY,
  parcel_id     TEXT NOT NULL REFERENCES parcels(parcel_id),
  recorded_at   TEXT NOT NULL,  -- recorder's timestamp, YYYY-MM-DDTHH:MM:SS
  sale_price    INTEGER NOT NULL CHECK (sale_price > 0),
  validity_code TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parcels_neighborhood ON parcels(neighborhood_code);
CREATE INDEX IF NOT EXISTS idx_sales_parcel ON sales(parcel_id);
CREATE INDEX IF NOT EXISTS idx_sales_recorded_at ON sales(recorded_at);
`;

export function applySchema(db: Db): void {
  db.exec(SCHEMA_SQL);
}
