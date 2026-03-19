"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
require("dotenv/config");
async function checkTableInfo() {
    console.log('Checking Table Info for inventory...');
    try {
        const client = await db_1.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    schemaname, 
                    relname, 
                    n_live_tup, 
                    n_dead_tup, 
                    last_vacuum, 
                    last_autovacuum 
                FROM pg_stat_all_tables 
                WHERE relname = 'inventory';
            `);
            console.log('--- Table Stats ---');
            console.table(result.rows);
            const columns = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'inventory';
            `);
            console.log('--- Columns ---');
            console.table(columns.rows);
        }
        finally {
            client.release();
        }
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED check table info:');
        console.error(error.message);
        process.exit(1);
    }
}
checkTableInfo();
