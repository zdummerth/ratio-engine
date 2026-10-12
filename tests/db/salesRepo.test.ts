import { beforeEach, describe, expect, it } from 'vitest';
import { insertAssessment } from '@/lib/db/writers';
import { findQualifiedSales } from '@/lib/repos/salesRepo';
import { FixtureDb } from '../helpers/fixtureDb';

const period = { taxYear: 2026, periodStart: '2024-01-01', periodEnd: '2025-12-31' };

describe('findQualifiedSales', () => {
  let fx: FixtureDb;
  const ids: Record<string, string> = {};

  beforeEach(() => {
    fx = new FixtureDb();
    ids.midPeriod = fx.addSale({ neighborhood: 'N1', recordedAt: '2025-03-15T10:00:00', salePrice: 250_000, assessedValue: 240_000 }).saleId;
    ids.firstDay = fx.addSale({ neighborhood: 'N1', recordedAt: '2024-01-01T08:30:00', salePrice: 200_000, assessedValue: 190_000 }).saleId;
    ids.unqualified = fx.addSale({ neighborhood: 'N1', recordedAt: '2025-04-01T11:00:00', salePrice: 150_000, assessedValue: 210_000, validityCode: 'U2' }).saleId;
    ids.beforePeriod = fx.addSale({ neighborhood: 'N1', recordedAt: '2023-12-29T14:00:00', salePrice: 210_000, assessedValue: 200_000 }).saleId;
    ids.afterPeriod = fx.addSale({ neighborhood: 'N1', recordedAt: '2026-01-02T09:15:00', salePrice: 260_000, assessedValue: 250_000 }).saleId;
    ids.commercial = fx.addSale({ neighborhood: 'N1', propertyClass: 'COM', recordedAt: '2024-08-20T13:00:00', salePrice: 900_000, assessedValue: 880_000 }).saleId;
    ids.otherNeighborhood = fx.addSale({ neighborhood: 'N2', recordedAt: '2024-11-05T15:30:00', salePrice: 310_000, assessedValue: 300_000 }).saleId;
    ids.priorYearOnly = fx.addSale({ neighborhood: 'N1', recordedAt: '2024-06-10T10:00:00', salePrice: 180_000, assessedValue: 170_000, taxYear: 2025 }).saleId;
  });

  it('returns qualified sales recorded within the period, ordered by recording time', () => {
    const sales = findQualifiedSales(fx.db, period);
    expect(sales.map((s) => s.saleId)).toEqual([ids.firstDay, ids.commercial, ids.otherNeighborhood, ids.midPeriod]);
  });

  it('pairs each sale with its assessment for the study tax year', () => {
    const { parcelId } = fx.addSale({ neighborhood: 'N1', recordedAt: '2024-09-09T09:00:00', salePrice: 300_000, assessedValue: 290_000 });
    insertAssessment(fx.db, { parcelId, taxYear: 2025, assessedValue: 270_000 });

    const current = findQualifiedSales(fx.db, period).find((s) => s.parcelId === parcelId);
    const prior = findQualifiedSales(fx.db, { ...period, taxYear: 2025 }).find((s) => s.parcelId === parcelId);
    expect(current?.assessedValue).toBe(290_000);
    expect(prior?.assessedValue).toBe(270_000);
  });

  it('excludes sales whose parcel has no assessment for the tax year', () => {
    const sales = findQualifiedSales(fx.db, period);
    expect(sales.map((s) => s.saleId)).not.toContain(ids.priorYearOnly);
    expect(findQualifiedSales(fx.db, { ...period, taxYear: 2025 }).map((s) => s.saleId)).toEqual([ids.priorYearOnly]);
  });

  it('filters by property class', () => {
    const sales = findQualifiedSales(fx.db, { ...period, propertyClasses: ['COM'] });
    expect(sales.map((s) => s.saleId)).toEqual([ids.commercial]);
    expect(sales[0]).toMatchObject({ propertyClass: 'COM', neighborhood: 'N1', salePrice: 900_000, assessedValue: 880_000 });
  });

  it('filters by neighborhood', () => {
    const sales = findQualifiedSales(fx.db, { ...period, neighborhoods: ['N2'] });
    expect(sales.map((s) => s.saleId)).toEqual([ids.otherNeighborhood]);
  });

  it('treats empty filter lists as no filter', () => {
    const all = findQualifiedSales(fx.db, period);
    expect(findQualifiedSales(fx.db, { ...period, propertyClasses: [], neighborhoods: [] })).toEqual(all);
  });
});
