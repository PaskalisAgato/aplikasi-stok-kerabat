import { pool } from './db/index.js';
import 'dotenv/config';
async function testInventoryRow1() {
    console.log('Testing Inventory Raw Row Fetch (ID 1)...');
    try {
        const result = await pool.query('SELECT * FROM inventory WHERE id = 1');
        if (result.rows.length === 0) {
            console.log('Row ID 1 not found.');
        }
        else {
            console.log(`Success! Fetched Row ID 1.`);
            // Only log first 50 chars of image_url if it exists
            const row = result.rows[0];
            if (row.image_url) {
                row.image_url = row.image_url.substring(0, 50) + '...';
            }
            console.log(JSON.stringify(row, null, 2));
        }
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED row 1 fetch:');
        console.error(error.message);
        process.exit(1);
    }
}
testInventoryRow1();
