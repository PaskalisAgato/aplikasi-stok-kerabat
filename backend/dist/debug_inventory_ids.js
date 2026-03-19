"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
require("dotenv/config");
async function testAllInventoryIds() {
    console.log('Fetching all Inventory IDs...');
    try {
        const result = await db_1.pool.query('SELECT id FROM inventory ORDER BY id ASC');
        console.log(`Success! Found IDs: ${result.rows.map(r => r.id).join(', ')}`);
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED ID fetch:');
        console.error(error.message);
        process.exit(1);
    }
}
testAllInventoryIds();
