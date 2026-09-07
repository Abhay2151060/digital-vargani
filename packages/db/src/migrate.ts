import * as fs from 'fs';
import * as path from 'path';
import { pool } from './client';

export async function runMigrations() {
  console.log('Running database migrations...');
  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(__dirname, '../src/schema.sql');
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    try {
      await client.query(sql);
    } catch (e) {
      console.warn('Base schema apply warning:', e);
    }

    try {
      await client.query("ALTER TYPE payment_mode ADD VALUE IF NOT EXISTS 'PENDING'");
    } catch (e) {
      console.warn('payment_mode enum warning:', e);
    }

    await client.query("ALTER TABLE mandals ADD COLUMN IF NOT EXISTS upi_qr_url TEXT;");
    await client.query("ALTER TABLE mandals ADD COLUMN IF NOT EXISTS ahwal_url TEXT;");
    await client.query("ALTER TABLE mandals ADD COLUMN IF NOT EXISTS ahwal_title VARCHAR(200);");
    await client.query("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_mode payment_mode NOT NULL DEFAULT 'CASH';");
    try {
      await client.query("ALTER TABLE expenses ALTER COLUMN category TYPE TEXT;");
    } catch (e) {
      console.warn('expenses category type warning:', e);
    }
    try {
      await client.query("UPDATE users SET full_name = username WHERE (full_name IS NULL OR TRIM(full_name) = '') AND username IS NOT NULL;");
      await client.query("UPDATE users SET full_name = REPLACE(full_name, '_', ' ') WHERE full_name LIKE '%_%';");
    } catch (e) {
      console.warn('clean full_name warning:', e);
    }
    console.log('Successfully applied database schema and added all columns.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
