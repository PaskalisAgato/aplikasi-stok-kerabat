import 'dotenv/config';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function debugVouchers() {
    const searchCode = process.argv[2] || 'KKT-VXG82X';
    console.log(`--- Searching for Voucher: ${searchCode} ---`);
    const [found] = await db.select().from(schema.standVouchers).where(eq(schema.standVouchers.code, searchCode)).limit(1);
    if (found) {
        console.log('FOUND:');
        console.table([found]);
    } else {
        console.log('NOT FOUND in stand_vouchers table.');
    }

    console.log('\n--- Latest 5 Vouchers (Sorted by Newest) ---');
    const vouchers = await db.select().from(schema.standVouchers).orderBy(desc(schema.standVouchers.createdAt)).limit(5);
    console.table(vouchers);
    
    process.exit(0);
}
debugVouchers();
