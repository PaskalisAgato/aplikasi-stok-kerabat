import { pool } from './db/index.js';
import 'dotenv/config';
async function testInventoryNoImages() {
    console.log('Testing Inventory Fetch (EXCLUDING IMAGES)...');
    try {
        const result = await pool.query('SELECT id, name, category, unit, current_stock, min_stock, price_per_unit, discount_price FROM inventory');
        console.log(`Success! Fetched ${result.rows.length} rows.`);
        console.log('Sample row (No Image):', JSON.stringify(result.rows[0], null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED fetch without images:');
        console.error(error.message);
        process.exit(1);
    }
}
testInventoryNoImages();
