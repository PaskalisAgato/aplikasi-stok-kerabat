import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
    try {
        console.log("Checking attendance table columns...");
        const result = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'attendance'
            ORDER BY ordinal_position;
        `);
        console.log("Columns found:");
        console.table(result.rows);
    } catch (error) {
        console.error("Error checking schema:", error);
    } finally {
        process.exit();
    }
}

checkSchema();
