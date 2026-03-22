import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkTables() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
        
        // Check specifically for work_shifts and shifts
        const targetTables = ['work_shifts', 'shifts', 'attendance'];
        for (const table of targetTables) {
            const exists = res.rows.some(r => r.table_name === table);
            console.log(`Table "${table}" exists: ${exists}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkTables();
