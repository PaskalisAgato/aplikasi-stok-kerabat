import { db } from './db/index.js';
import * as schema from './db/schema.js';
import 'dotenv/config';
async function testInventory() {
    console.log('Testing Inventory Fetch...');
    try {
        const items = await db.select().from(schema.inventory);
        console.log(`Success! Fetched ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample item:', JSON.stringify(items[0], null, 2));
        }
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED to fetch inventory:');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}
testInventory();
