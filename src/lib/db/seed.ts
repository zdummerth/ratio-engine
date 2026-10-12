import type { PropertyClass } from '../types';
import { inTransaction, type Db } from './connection';
import { insertAssessment, insertNeighborhood, insertParcel, insertSale } from './writers';

/**
 * Deterministic synthetic data for local development and demos.
 *
 * Every number is produced by a seeded PRNG using plain arithmetic only, so
 * the same seed yields byte-identical data on every platform. None of this is
 * real parcel data.
 */

export const DEFAULT_SEED = 20260125;

/** Tax years that receive assessments. Market values are as of Jan 1 of the later year. */
export const SEED_TAX_YEARS = [2025, 2026] as const;

interface NeighborhoodProfile {
  code: string;
  name: string;
  parcels: Partial<Record<PropertyClass, number>>;
  /** Typical assessment level (ratio) in the neighborhood. */
  level: number;
  /** Spread of individual assessment errors. */
  dispersion: number;
  /** How strongly ratios fall as value rises (0 = neutral). */
  regressivity: number;
}

const NEIGHBORHOODS: NeighborhoodProfile[] = [
  { code: 'N101', name: 'Oak Hollow', parcels: { RES: 320 }, level: 0.97, dispersion: 0.06, regressivity: 0 },
  { code: 'N102', name: 'Riverside', parcels: { RES: 260, CON: 60 }, level: 0.84, dispersion: 0.08, regressivity: 0 },
  { code: 'N103', name: 'Mill Creek', parcels: { RES: 280 }, level: 1.0, dispersion: 0.21, regressivity: 0.02 },
  { code: 'N104', name: 'Cedar Park', parcels: { RES: 220, VAC: 40 }, level: 0.95, dispersion: 0.07, regressivity: 0.22 },
  { code: 'N105', name: 'Old Town', parcels: { RES: 110, CON: 150, COM: 60 }, level: 0.99, dispersion: 0.09, regressivity: 0 },
  { code: 'N106', name: 'Eastgate', parcels: { RES: 70, COM: 80, VAC: 60 }, level: 0.93, dispersion: 0.13, regressivity: 0.05 },
  { code: 'N107', name: 'Willow Bend', parcels: { RES: 16 }, level: 1.02, dispersion: 0.08, regressivity: 0 },
];

const CLASS_PROFILES: Record<PropertyClass, { medianValue: number; spread: number; saleRate: number }> = {
  RES: { medianValue: 265_000, spread: 0.35, saleRate: 0.42 },
  CON: { medianValue: 185_000, spread: 0.3, saleRate: 0.45 },
  COM: { medianValue: 900_000, spread: 0.6, saleRate: 0.22 },
  VAC: { medianValue: 70_000, spread: 0.5, saleRate: 0.3 },
};

const CLASS_ORDER: PropertyClass[] = ['RES', 'CON', 'COM', 'VAC'];

const STREETS = [
  'Maple Ave', 'Elm St', 'Lindell Blvd', 'Pershing Ave', 'Tower Grove Ave', 'Arsenal St',
  'Chippewa St', 'Gravois Ave', 'Morgan Ford Rd', 'Hampton Ave', 'Delor St', 'Bates St',
];

const NON_QUALIFIED_CODES = ['U1', 'U2', 'U3', 'U4'];

/** Recording window for generated sales; wider than a typical two-year study period. */
const SALES_WINDOW_START = Date.UTC(2023, 6, 1); // 2023-07-01
const SALES_WINDOW_END = Date.UTC(2026, 2, 31); // 2026-03-31
const VALUATION_DATE = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;

export interface SeedSummary {
  neighborhoods: number;
  parcels: number;
  assessments: number;
  sales: number;
}

export function seedDatabase(db: Db, seed: number = DEFAULT_SEED): SeedSummary {
  const random = mulberry32(seed);
  const businessDays = listBusinessDays(SALES_WINDOW_START, SALES_WINDOW_END);
  const summary: SeedSummary = { neighborhoods: 0, parcels: 0, assessments: 0, sales: 0 };
  let saleSequence = 0;

  inTransaction(db, () => {
    for (const profile of NEIGHBORHOODS) {
      insertNeighborhood(db, { code: profile.code, name: profile.name });
      summary.neighborhoods += 1;
      let parcelSequence = 0;

      for (const propertyClass of CLASS_ORDER) {
        const count = profile.parcels[propertyClass] ?? 0;
        const classProfile = CLASS_PROFILES[propertyClass];

        for (let i = 0; i < count; i += 1) {
          parcelSequence += 1;
          const parcelId = `${profile.code.slice(1)}-${String(parcelSequence).padStart(4, '0')}`;
          insertParcel(db, {
            parcelId,
            neighborhood: profile.code,
            propertyClass,
            situsAddress: `${100 + Math.floor(random() * 9800)} ${pick(random, STREETS)}`,
            yearBuilt: propertyClass === 'VAC' ? null : yearBuilt(random, propertyClass),
          });
          summary.parcels += 1;

          const marketValue = classProfile.medianValue * clamp(1 + classProfile.spread * normal(random), 0.3, 3);
          const relativeValue = marketValue / classProfile.medianValue;
          const levelFactor =
            profile.level *
            clamp(1 + profile.dispersion * normal(random), 0.55, 1.6) *
            clamp(1 - profile.regressivity * (relativeValue - 1), 0.6, 1.4);
          const assessed2026 = roundToNearest(marketValue * levelFactor, 100);
          const assessed2025 = roundToNearest(assessed2026 * 0.95, 100);

          insertAssessment(db, { parcelId, taxYear: 2025, assessedValue: assessed2025 });
          summary.assessments += 1;
          // About 1% of parcels were split or newly created and have no current-year value yet.
          if (random() >= 0.01) {
            insertAssessment(db, { parcelId, taxYear: 2026, assessedValue: assessed2026 });
            summary.assessments += 1;
          }

          const saleCount = random() < classProfile.saleRate ? (random() < 0.06 ? 2 : 1) : 0;
          for (let s = 0; s < saleCount; s += 1) {
            const day = businessDays[Math.floor(random() * businessDays.length)]!;
            const monthsBeforeValuation = (VALUATION_DATE - day) / DAY_MS / 30.4375;
            const marketTrend = 1 - 0.004 * monthsBeforeValuation;
            let salePrice = marketValue * marketTrend * clamp(1 + 0.04 * normal(random), 0.85, 1.15);
            // A small share of qualified sales carry data-entry or atypical-price problems.
            const quirk = random();
            if (quirk < 0.012) salePrice *= 0.45;
            else if (quirk < 0.024) salePrice *= 2.1;

            saleSequence += 1;
            insertSale(db, {
              saleId: `S${String(saleSequence).padStart(6, '0')}`,
              parcelId,
              recordedAt: `${formatDate(day)}T${recordingTime(random)}`,
              salePrice: roundToNearest(salePrice, 500),
              validityCode: random() < 0.86 ? 'Q' : pick(random, NON_QUALIFIED_CODES),
            });
            summary.sales += 1;
          }
        }
      }
    }
  });

  return summary;
}

/** True when the database has no sales yet. */
export function isEmpty(db: Db): boolean {
  const row = db.prepare('SELECT COUNT(*) AS n FROM sales').get() as { n: number };
  return row.n === 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Approximately standard normal (Irwin-Hall with 12 uniforms); arithmetic only. */
function normal(random: () => number): number {
  let total = 0;
  for (let i = 0; i < 12; i += 1) total += random();
  return total - 6;
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function yearBuilt(random: () => number, propertyClass: PropertyClass): number {
  const [from, to] = propertyClass === 'CON' ? [1965, 2023] : propertyClass === 'COM' ? [1950, 2020] : [1925, 2024];
  return from + Math.floor(random() * (to - from + 1));
}

function listBusinessDays(startMs: number, endMs: number): number[] {
  const days: number[] = [];
  for (let t = startMs; t <= endMs; t += DAY_MS) {
    const weekday = new Date(t).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(t);
  }
  return days;
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Recorder's office hours, 08:00:00 to 16:59:59. */
function recordingTime(random: () => number): string {
  const seconds = Math.floor(random() * 9 * 3600);
  const hh = String(8 + Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
