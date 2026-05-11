import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

async function checkMismatch() {
    try {
        const tableConfig = getTableConfig(schema.sales);
        const schemaColumns = Object.values(tableConfig.columns).map(c => c.name);
        
        const dbColumnsResult = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sales';
        `);
        const dbColumns = dbColumnsResult.rows.map((r: any) => r.column_name);

        console.log("Schema Columns:", schemaColumns);
        console.log("DB Columns:", dbColumns);

        const missingInDB = schemaColumns.filter(c => !dbColumns.includes(c));
        const extraInDB = dbColumns.filter(c => !schemaColumns.includes(c));

        console.log("Missing in DB (but in schema):", missingInDB);
        console.log("Extra in DB (but not in schema):", extraInDB);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkMismatch();
