import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './backend/src/db/schema.js';
import dotenv from 'dotenv';
import path from 'path';

// Load from backend/.env
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool, { schema });

async function checkAdminPins() {
    try {
        console.log('Fetching Admin users from Supabase...');
        const admins = await db.select().from(schema.users).where(eq(schema.users.role, 'Admin'));
        
        if (admins.length === 0) {
            console.log('NO ADMIN USERS FOUND!');
        } else {
            admins.forEach(u => {
                console.log(`Name: ${u.name} | PIN: ${u.pin} | Role: ${u.role}`);
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

import { eq } from 'drizzle-orm';
checkAdminPins();
