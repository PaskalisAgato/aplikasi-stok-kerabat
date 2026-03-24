import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function migrateSystemLogsFlags() {
    console.log('--- DB Module: Migrating System Logs Schema ---');
    
    try {
        await db.execute(sql`
            ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'INFO' NOT NULL;
        `);
        console.log('✓ Industry-standard log levels added to system_logs.');
    } catch (error) {
        console.error('Failed to migrate system_logs:', error);
    }
}

migrateSystemLogsFlags().then(() => process.exit(0)).catch(() => process.exit(1));
