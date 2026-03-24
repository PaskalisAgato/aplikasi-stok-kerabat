import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function addDeadlineColumn() {
    try {
        console.log("Adding 'deadline' column to 'todos' table...");
        await db.execute(sql`ALTER TABLE "todos" ADD COLUMN IF NOT EXISTS "deadline" timestamp;`);
        console.log("Column 'deadline' added successfully.");
    } catch (error) {
        console.error("Error adding column:", error);
    } finally {
        process.exit();
    }
}

addDeadlineColumn();
