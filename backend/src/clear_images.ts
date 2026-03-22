import { pool } from './db/index.js';
import 'dotenv/config';

async function clearInventoryImages() {
    console.log('Clearing all image_url values from inventory...');
    try {
        const result = await pool.query('UPDATE inventory SET image_url = NULL');
        console.log(`Success! Updated ${result.rowCount} rows.`);
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED to clear images:');
        console.error(error.message);
        process.exit(1);
    }
}

clearInventoryImages();
