const DEVELOPMENT_DATABASE_ENVS = new Set(['development', 'test']);
const LOCAL_DATABASE_URL = 'postgresql://vargani_user:vargani_password@localhost:5432/vargani_db';

export function getDatabaseUrl(): string {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (connectionString) {
    return connectionString;
  }

  if (DEVELOPMENT_DATABASE_ENVS.has(process.env.NODE_ENV || 'development')) {
    return LOCAL_DATABASE_URL;
  }

  throw new Error('DATABASE_URL or DIRECT_URL must be configured outside development and test environments.');
}
