import { db } from './src/db';
import * as schema from './src/db/schema.js';
import { sql } from 'drizzle-orm';

async function test() {
    console.log('🔍 Testing DB connection...');
    try {
        const result = await db.execute(sql`SELECT current_database(), current_user;`);
        console.log('✅ Connection successful:', result.rows);
        
        const inventoryCount = await db.execute(sql`SELECT count(*) FROM inventory`);
        console.log('📦 Inventory count:', inventoryCount.rows[0].count);
        
        process.exit(0);
    } catch (e: any) {
        console.error('❌ Error checking inventory:', e.message);
        process.exit(1);
    }
}

test();
