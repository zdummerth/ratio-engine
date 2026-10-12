import fs from 'node:fs';
import path from 'node:path';
import { openDatabase } from '../src/lib/db/connection';
import { seedDatabase } from '../src/lib/db/seed';

/** Recreates data/ratio-study.db (or DATABASE_PATH) with the deterministic demo data. */
const location = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'ratio-study.db');

if (location !== ':memory:') {
  fs.mkdirSync(path.dirname(location), { recursive: true });
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(`${location}${suffix}`, { force: true });
}

const db = openDatabase(location);
const summary = seedDatabase(db);
db.close();

console.log(`Seeded ${location}`);
console.log(
  `  ${summary.neighborhoods} neighborhoods, ${summary.parcels} parcels, ` +
    `${summary.assessments} assessments, ${summary.sales} sales`,
);
