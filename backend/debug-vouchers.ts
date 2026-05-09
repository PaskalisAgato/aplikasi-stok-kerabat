import 'dotenv/config';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function debugVouchers() {
    console.log('--- Latest 5 Vouchers ---');
    const vouchers = await db.select().from(schema.standVouchers).orderBy(desc(schema.standVouchers.createdAt)).limit(5);
    console.table(vouchers);

    console.log('\n--- Active QR Template ---');
    const templates = await db.select().from(schema.discounts)
        .where(eq(schema.discounts.type, 'qr_voucher'))
        .limit(1);
    console.table(templates);
    
    process.exit(0);
}
debugVouchers();
