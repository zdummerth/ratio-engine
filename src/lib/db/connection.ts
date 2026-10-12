import { DatabaseSync } from 'node:sqlite';
import { applySchema } from './schema';

export type Db = DatabaseSync;

/** Opens (or creates) a database at `path` and ensures the schema exists. Use `:memory:` for tests. */
export function openDatabase(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  applySchema(db);
  return db;
}

/** Runs `work` inside a transaction, rolling back if it throws. */
export function inTransaction<T>(db: Db, work: () => T): T {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
