import type { Db } from '../db/connection';
import type { Neighborhood } from '../types';

export function listNeighborhoods(db: Db): Neighborhood[] {
  return db.prepare('SELECT code, name FROM neighborhoods ORDER BY code').all() as unknown as Neighborhood[];
}
