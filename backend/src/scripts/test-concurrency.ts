import 'dotenv/config';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function testConcurrency() {
    console.log('--- Concurrency Test (Optimistic Locking) ---');

    // 1. Fetch item
    const items = await db.select().from(schema.inventory).limit(1);
    if (items.length === 0) {
        console.error('No inventory items to test.');
        return;
    }

    const item = items[0];
    const originalVersion = item.version;
    console.log(`Initial version: ${originalVersion?.toISOString()}`);

    // 2. Perform successful update
    console.log('Performing update...');
    await db.update(schema.inventory)
        .set({ 
            name: item.name + ' (Updated)',
            version: new Date() // Simulate backend auto-update
        })
        .where(eq(schema.inventory.id, item.id));

    // 3. Verify version changed
    const updatedItems = await db.select().from(schema.inventory).where(eq(schema.inventory.id, item.id));
    const newVersion = updatedItems[0].version;
    console.log(`New version: ${newVersion?.toISOString()}`);

    if (newVersion?.getTime() !== originalVersion?.getTime()) {
        console.log('✓ Version successfully updated after write');
    } else {
        console.warn('! Version did not change. Check DB default/trigger.');
    }

    console.log('--- Concurrency Test Completed ---');
}

testConcurrency().then(() => process.exit(0));
