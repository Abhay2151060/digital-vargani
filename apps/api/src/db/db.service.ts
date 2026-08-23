import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  private pool: Pool;

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://vargani_user:vargani_password@localhost:5432/vargani_db';

    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    mandalIds?: string[]
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      if (mandalIds && mandalIds.length > 0) {
        await client.query(`SELECT set_config('app.current_mandal_ids', $1, false)`, [mandalIds.join(',')]);
      }
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }

  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    mandalIds?: string[]
  ): Promise<T> {
    const client = await this.pool.connect();
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
      this.logger.error('Transaction rollback due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
