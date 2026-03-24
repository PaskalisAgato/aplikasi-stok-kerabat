import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function ensureIdempotencyTable() {
    console.log('--- DB Module: Initializing Idempotency Table ---');
    
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS idempotency_keys (
                key TEXT PRIMARY KEY,
                response_body JSONB NOT NULL,
                status_code INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Add index on created_at for cleanup
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idempotency_keys_created_at_idx ON idempotency_keys (created_at);
        `);

        console.log('✓ Idempotency table ensured.');
    } catch (error) {
        console.error('Failed to create idempotency table:', error);
    }
}

ensureIdempotencyTable().then(() => process.exit(0)).catch(() => process.exit(1));
