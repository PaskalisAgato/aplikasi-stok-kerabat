import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('--- Adding voucher columns to sales table ---');
    try {
        await db.execute(sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS voucher_code TEXT;`);
        await db.execute(sql`ALTER TABLE sales ADD COLUMN IF NOT EXISTS voucher_rule_code TEXT;`);
        console.log('Success: Columns added.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
    process.exit(0);
}

migrate();
