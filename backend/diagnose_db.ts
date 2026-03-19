import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function diagnose() {
    try {
        console.log("Diagonising User Table...");
        
        // 1. Check columns
        const columns = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user';
        `);
        console.log("Columns in 'user' table:", JSON.stringify(columns.rows, null, 2));

        // 2. Try to fetch first 5 users
        const users = await db.execute(sql`SELECT * FROM "user" LIMIT 5;`);
        console.log("First 5 users:", JSON.stringify(users.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Diagnosis failed:", e);
        process.exit(1);
    }
}

diagnose();
