import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Migrating discounts table to support soft delete...");
        
        // Add is_deleted column to discounts
        await db.execute(sql`ALTER TABLE discounts ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;`);
        
        console.log("Successfully migrated database!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

main();
