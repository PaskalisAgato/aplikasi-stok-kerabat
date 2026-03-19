"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
require("dotenv/config");
async function testInventoryRow() {
    console.log('Testing Inventory Raw Row Fetch (ID 2)...');
    try {
        const result = await db_1.pool.query('SELECT * FROM inventory WHERE id = 2');
        console.log(`Success! Fetched Row:`, JSON.stringify(result.rows[0], null, 2));
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED row fetch:');
        console.error(error.message);
        process.exit(1);
    }
}
testInventoryRow();
