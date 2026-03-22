import { pool } from './db/index.js';
import 'dotenv/config';

async function testAllInventoryIds() {
    console.log('Fetching all Inventory IDs...');
    try {
        const result = await pool.query('SELECT id FROM inventory ORDER BY id ASC');
        console.log(`Success! Found IDs: ${result.rows.map((r: any) => r.id).join(', ')}`);
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED ID fetch:');
        console.error(error.message);
        process.exit(1);
    }
}

testAllInventoryIds();
