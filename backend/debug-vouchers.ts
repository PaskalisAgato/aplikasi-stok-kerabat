import 'dotenv/config';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function debugVouchers() {
    const searchCode = process.argv[2] || 'KKT-VXG82S';
    console.log(`\n--- Inspecting Voucher: ${searchCode} ---`);
    const [found] = await db.select().from(schema.standVouchers).where(eq(schema.standVouchers.code, searchCode)).limit(1);
    
    if (found) {
        console.table([found]);
    } else {
        console.log(`Voucher ${searchCode} not found.`);
    }
    
    console.log('\n--- Latest 5 Transactions ---');
    const latestSales = await db.select().from(schema.sales).orderBy(desc(schema.sales.id)).limit(5);
    console.table(latestSales);

    process.exit(0);
}
debugVouchers();
