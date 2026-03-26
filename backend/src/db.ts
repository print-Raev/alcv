import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString ? new Pool({ connectionString }) : null;

type LocalLead = Record<string, unknown>;
const localStore: LocalLead[] = [];

export async function query(text: string, params: unknown[] = []) {
  if (!pool) {
    if (text.startsWith('SELECT * FROM leads WHERE is_deleted=false')) return { rows: localStore.filter((l) => !l.is_deleted) };
    return { rows: [] };
  }
  return pool.query(text, params);
}

export function getLocalStore() {
  return localStore;
}
