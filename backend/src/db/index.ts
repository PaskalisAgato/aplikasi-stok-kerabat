import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import 'dotenv/config';

// Create a Postgres connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // max connection limits optimized for rate limits & multi-transaction
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Auto-check connection on App Start
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
