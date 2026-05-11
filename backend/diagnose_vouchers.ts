import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function diagnose() {
    try {
        console.log("Diagnosing Sales Table...");
        const salesCols = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales';
        `);
        console.log("Columns in 'sales' table:", JSON.stringify(salesCols.rows, null, 2));

        console.log("\nDiagnosing Stand Vouchers Table...");
        const voucherCols = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'stand_vouchers';
        `);
        console.log("Columns in 'stand_vouchers' table:", JSON.stringify(voucherCols.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error("Diagnosis failed:", e);
        process.exit(1);
    }
}

diagnose();
