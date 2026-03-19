"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
require("dotenv/config");
async function clearInventoryImages() {
    console.log('Clearing all image_url values from inventory...');
    try {
        const result = await db_1.pool.query('UPDATE inventory SET image_url = NULL');
        console.log(`Success! Updated ${result.rowCount} rows.`);
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED to clear images:');
        console.error(error.message);
        process.exit(1);
    }
}
clearInventoryImages();
