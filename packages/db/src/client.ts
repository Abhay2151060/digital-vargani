import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://vargani_user:vargani_password@localhost:5432/vargani_db';

const isSSLNeeded =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('supabase') ||
  connectionString.includes('neon') ||
  connectionString.includes('sslmode=require');

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isSSLNeeded ? { rejectUnauthorized: false } : false,
});

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  mandalIds?: string[]
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    if (mandalIds && mandalIds.length > 0) {
      await client.query(`SELECT set_config('app.current_mandal_ids', $1, true)`, [mandalIds.join(',')]);
    }
    return await client.query<T>(text, params);
  } finally {
    // Reset session configuration to prevent connection pool leakage
    try {
      await client.query(`SELECT set_config('app.current_mandal_ids', '', false)`);
    } catch {}
    client.release();
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  mandalIds?: string[]
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (mandalIds && mandalIds.length > 0) {
      await client.query(`SELECT set_config('app.current_mandal_ids', $1, true)`, [mandalIds.join(',')]);
    }
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    try {
      await client.query(`SELECT set_config('app.current_mandal_ids', '', false)`);
    } catch {}
    client.release();
  }
}
