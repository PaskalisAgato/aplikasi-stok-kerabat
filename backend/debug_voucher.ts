import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function listAllQR() {
    try {
        const results = await db.select({
            id: schema.discounts.id,
            name: schema.discounts.name,
            type: schema.discounts.type
        }).from(schema.discounts).where(eq(schema.discounts.type, 'qr_voucher'));
        console.log('--- ALL QR VOUCHER TEMPLATES ---');
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Database Error:', e);
    }
    process.exit(0);
}

listAllQR().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
