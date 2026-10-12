export const PROPERTY_CLASSES = ['RES', 'CON', 'COM', 'VAC'] as const;

export type PropertyClass = (typeof PROPERTY_CLASSES)[number];

export const PROPERTY_CLASS_LABELS: Record<PropertyClass, string> = {
  RES: 'Residential',
  CON: 'Condominium',
  COM: 'Commercial',
  VAC: 'Vacant land',
};

export function isPropertyClass(value: unknown): value is PropertyClass {
  return typeof value === 'string' && (PROPERTY_CLASSES as readonly string[]).includes(value);
}

/** A qualified sale paired with its parcel's assessment for the study tax year. */
export interface SaleRecord {
  saleId: string;
  parcelId: string;
  neighborhood: string;
  propertyClass: PropertyClass;
  /** Recorder's timestamp, e.g. `2025-06-14T10:32:00`. */
  recordedAt: string;
  salePrice: number;
  assessedValue: number;
}

export interface RatioObservation extends SaleRecord {
  /** assessedValue / salePrice */
  ratio: number;
}

export interface Neighborhood {
  code: string;
  name: string;
}
