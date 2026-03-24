import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function finalFixSchema() {
    console.log('--- DB Module: Synchronizing Final Enterprise Schema ---');
    
    try {
        // 1. Attendance Table
        await db.execute(sql`
            ALTER TABLE attendance ADD COLUMN IF NOT EXISTS external_check_in_photo TEXT;
            ALTER TABLE attendance ADD COLUMN IF NOT EXISTS external_check_out_photo TEXT;
        `);
        console.log('✓ Attendance schema synchronized.');

        // 2. Todos Table
        await db.execute(sql`
            ALTER TABLE todos ADD COLUMN IF NOT EXISTS external_photo_proof TEXT;
        `);
        console.log('✓ Todos schema synchronized.');

        // 3. Todo Completions Table
        await db.execute(sql`
            ALTER TABLE todo_completions ADD COLUMN IF NOT EXISTS external_photo_proof TEXT;
        `);
        console.log('✓ Todo Completions schema synchronized.');

        // 4. Ensure Inventory Price Logs exists (just in case)
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS inventory_price_logs (
                id SERIAL PRIMARY KEY,
                item_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
                old_price NUMERIC(12, 2) NOT NULL,
                new_price NUMERIC(12, 2) NOT NULL,
                old_discount NUMERIC(12, 2) DEFAULT 0,
                new_discount NUMERIC(12, 2) DEFAULT 0,
                changed_by TEXT NOT NULL REFERENCES "user"(id),
                timestamp TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);
        console.log('✓ Inventory Price Logs table verified/created.');

    } catch (error) {
        console.error('Final synchronization failed:', error);
    }
}

finalFixSchema().then(() => process.exit(0)).catch(() => process.exit(1));
