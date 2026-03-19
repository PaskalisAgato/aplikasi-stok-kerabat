import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: {
        rejectUnauthorized: false
    },
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    console.log('--- DB Config: Connected to PostgreSQL ---');
});

pool.on('error', (err: Error) => {
    console.error('--- DB Config: Pool Error ---', err.message);
});

export const db = drizzle(pool, { schema });
export default db;
