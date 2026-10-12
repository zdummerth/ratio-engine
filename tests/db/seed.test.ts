import { describe, expect, it } from 'vitest';
import { openDatabase, type Db } from '@/lib/db/connection';
import { seedDatabase } from '@/lib/db/seed';

function seeded(seed?: number): { db: Db; summary: ReturnType<typeof seedDatabase> } {
  const db = openDatabase(':memory:');
  const summary = seedDatabase(db, seed);
  return { db, summary };
}

const allSales = (db: Db) => db.prepare('SELECT * FROM sales ORDER BY sale_id').all();

describe('seedDatabase', () => {
  it('produces the same demo data every time', () => {
    const first = seeded();
    const second = seeded();
    expect(first.summary).toEqual({ neighborhoods: 7, parcels: 1726, assessments: 3437, sales: 767 });
    expect(second.summary).toEqual(first.summary);
    expect(allSales(second.db)).toEqual(allSales(first.db));
  });

  it('produces different data for a different seed', () => {
    expect(allSales(seeded(1).db)).not.toEqual(allSales(seeded().db));
  });

  it('writes recorder timestamps within office hours', () => {
    const { db } = seeded();
    const rows = db.prepare('SELECT recorded_at FROM sales').all() as { recorded_at: string }[];
    for (const { recorded_at } of rows) {
      expect(recorded_at).toMatch(/^\d{4}-\d{2}-\d{2}T(0[89]|1[0-6]):[0-5]\d:[0-5]\d$/);
    }
  });
});
