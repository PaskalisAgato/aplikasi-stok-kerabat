import { db } from './src/db';
import { users } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

async function test() {
    console.log('🔍 Testing DB connection...');
    try {
        const result = await db.execute(sql`SELECT current_database(), current_user;`);
        console.log('✅ Connection successful:', result.rows);
        
        const userCount = await db.select().from(users);
        console.log('👥 User count:', userCount.length);
        
        process.exit(0);
    } catch (e: any) {
        console.error('❌ Connection failed:', e.message);
        process.exit(1);
    }
}

test();
