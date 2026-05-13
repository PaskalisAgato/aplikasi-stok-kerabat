import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { desc } from 'drizzle-orm';

async function listVouchers() {
    console.log('--- Database Diagnostic: Latest Vouchers ---');
    try {
        console.log('Checking promo_vouchers...');
        const latestPromos = await db.select().from(schema.promoVouchers).orderBy(desc(schema.promoVouchers.createdAt)).limit(10);
        console.log('Latest Promo Vouchers:');
        if (latestPromos.length === 0) console.log(' (None found)');
        latestPromos.forEach(v => {
            console.log(` - Code: ${v.code} | Status: ${v.status} | Promo: ${v.promoName || 'N/A'}`);
        });

        console.log('\nChecking stand_vouchers...');
        const latestStands = await db.select().from(schema.standVouchers).orderBy(desc(schema.standVouchers.createdAt)).limit(10);
        console.log('Latest Stand Vouchers:');
        if (latestStands.length === 0) console.log(' (None found)');
        latestStands.forEach(v => {
            console.log(` - Code: ${v.code} | Status: ${v.status}`);
        });

    } catch (e: any) {
        console.error('ERROR during diagnosis:', e.message);
        if (e.message.includes('relation "promo_vouchers" does not exist')) {
            console.log('TIP: Table "promo_vouchers" is missing. Run "npx drizzle-kit push" to create it.');
        }
    }
    process.exit(0);
}

listVouchers();
