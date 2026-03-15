import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import 'dotenv/config';

console.log('--- DB Module: Initializing PG Pool ---');
if (!process.env.DATABASE_URL) {
    console.error('!!! FATAL: DATABASE_URL is missing in db/index.ts');
}

// Create a Postgres connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('--- DB Module: Pool connected to Postgres ---');
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Auto-check connection on App Start
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});
