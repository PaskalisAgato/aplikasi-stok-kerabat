import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { ilike } from 'drizzle-orm';

async function huntVoucher() {
    try {
        const results = await db.select().from(schema.discounts).where(ilike(schema.discounts.name, '%voucher 5 ribu%'));
        console.log('--- HUNT RESULTS ---');
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Database Error:', e);
    }
    process.exit(0);
}

huntVoucher().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
