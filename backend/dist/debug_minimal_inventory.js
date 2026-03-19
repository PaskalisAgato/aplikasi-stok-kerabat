"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
require("dotenv/config");
async function testMinimalInventory() {
    console.log('Testing MINIMAL Inventory Fetch (ID ONLY)...');
    try {
        const result = await db_1.pool.query('SELECT id FROM inventory LIMIT 1');
        console.log(`Success! Fetched ID: ${result.rows[0]?.id}`);
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED minimal fetch:');
        console.error(error.message);
        process.exit(1);
    }
}
testMinimalInventory();
