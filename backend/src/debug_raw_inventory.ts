import { pool } from './db/index.js';
import 'dotenv/config';

async function testRawInventory() {
    console.log('Testing RAW Inventory Fetch...');
    try {
        const result = await pool.query('SELECT * FROM inventory LIMIT 5');
        console.log(`Success! Fetched ${result.rows.length} rows.`);
        console.log('First row:', result.rows[0]);
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED raw fetch:');
        console.error(error.message);
        process.exit(1);
    }
}

testRawInventory();
