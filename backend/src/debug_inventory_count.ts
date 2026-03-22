import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function testInventoryCount() {
    console.log('Testing Inventory Count...');
    try {
        const result = await db.select({ count: sql`count(*)` }).from(schema.inventory);
        console.log(`Success! Total items: ${JSON.stringify(result[0])}`);
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED to fetch count:');
        console.error(error.message);
        process.exit(1);
    }
}

testInventoryCount();
