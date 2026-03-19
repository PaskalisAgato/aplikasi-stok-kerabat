"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
require("dotenv/config");
async function testRawInventory() {
    console.log('Testing RAW Inventory Fetch...');
    try {
        const result = await db_1.pool.query('SELECT * FROM inventory LIMIT 5');
        console.log(`Success! Fetched ${result.rows.length} rows.`);
        console.log('First row:', result.rows[0]);
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED raw fetch:');
        console.error(error.message);
        process.exit(1);
    }
}
testRawInventory();
