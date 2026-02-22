import { drizzle } from 'drizzle-orm/d1';
import * as schema from './wife-schema';

export function createWifeDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type WifeDatabase = ReturnType<typeof createWifeDb>;
