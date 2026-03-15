import { pool } from './db';
import 'dotenv/config';

async function testMinimalInventory() {
    console.log('Testing MINIMAL Inventory Fetch (ID ONLY)...');
    try {
        const result = await pool.query('SELECT id FROM inventory LIMIT 1');
        console.log(`Success! Fetched ID: ${result.rows[0]?.id}`);
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED minimal fetch:');
        console.error(error.message);
        process.exit(1);
    }
}

testMinimalInventory();
