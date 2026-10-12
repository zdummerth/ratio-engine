import path from 'node:path';
import { openDatabase, type Db } from './connection';
import { isEmpty, seedDatabase } from './seed';

let instance: Db | null = null;

/**
 * Shared database for the app. Reads `DATABASE_PATH` (default `data/ratio-study.db`);
 * use `:memory:` for an ephemeral database. An empty database is seeded with the
 * deterministic demo data on first use.
 */
export function getDb(): Db {
  if (instance === null) {
    const location = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'ratio-study.db');
    const db = openDatabase(location);
    if (isEmpty(db)) seedDatabase(db);
    instance = db;
  }
  return instance;
}
