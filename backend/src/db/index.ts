import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import 'dotenv/config';

console.log('--- DB Module: Initializing PG Pool ---');
if (!process.env.DATABASE_URL) {
    console.error('!!! FATAL: DATABASE_URL is missing in db/index.ts');
}

// Create a Postgres connection pool
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Reduced from 20 to be safer on free tiers
    ssl: {
        rejectUnauthorized: false
    },
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    console.log('--- DB Module: Pool connected to Postgres ---');
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Relaxed error handler: Don't crash the whole app on idle errors
pool.on('error', (err: Error) => {
    console.error('--- DB Pool Error (Non-Fatal) ---');
    console.error(err.message);
    // process.exit(-1); // REMOVED: Don't kill the server, let PG pool handle reconnections
});
