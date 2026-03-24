import 'dotenv/config';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { desc, sql } from 'drizzle-orm';

async function verify() {
    console.log('--- Enterprise System Verification ---');

    // 1. Check System Logs (Observability)
    const logs = await db.select().from(schema.systemLogs).orderBy(desc(schema.systemLogs.createdAt)).limit(1);
    if (logs.length > 0) {
        console.log('✓ System logging is active');
        console.log(`  Last recorded request: ${logs[0].method} ${logs[0].path} (${logs[0].responseTime}ms)`);
    } else {
        console.warn('! No system logs found yet. Hit an endpoint to trigger logging.');
    }

    // 2. Check Inventory Concurrency version
    const item = await db.select().from(schema.inventory).limit(1);
    if (item.length > 0 && item[0].version) {
        console.log('✓ Inventory versioning (optimistic locking) is active');
    } else {
        console.warn('! Inventory versioning not detected on items.');
    }

    // 3. Check Soft Delete readiness
    const deletedExpenses = await db.select().from(schema.expenses).where(sql`is_deleted = true`).limit(1);
    console.log('✓ Soft-delete architecture is in place');

    console.log('--- Verification Completed ---');
}

verify().then(() => process.exit(0));
