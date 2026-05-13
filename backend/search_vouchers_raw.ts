import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function run() {
    console.log('--- Checking Database Tables & Vouchers ---');
    try {
        const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
        
        const hasPromo = tables.rows.some(r => r.table_name === 'promo_vouchers');
        if (hasPromo) {
            console.log('Searching for KKT-RH8MBD in promo_vouchers...');
            const results = await db.execute(sql`SELECT * FROM promo_vouchers WHERE code LIKE 'KKT-RH8MBD%'`);
            console.log('Promo Matches:', results.rows);
        } else {
            console.log('Table promo_vouchers NOT found.');
        }

        const hasStand = tables.rows.some(r => r.table_name === 'stand_vouchers');
        if (hasStand) {
            console.log('Searching for KKT-RH8MBD in stand_vouchers...');
            const results = await db.execute(sql`SELECT * FROM stand_vouchers WHERE code LIKE 'KKT-RH8MBD%'`);
            console.log('Stand Matches:', results.rows);
        }

        const hasDiscounts = tables.rows.some(r => r.table_name === 'discounts');
        if (hasDiscounts) {
            console.log('Searching for KKT-RH8MBD in discounts...');
            const results = await db.execute(sql`SELECT * FROM discounts WHERE name LIKE '%KKT-RH8MBD%'`);
            console.log('Discount Matches:', results.rows);
        }

        const hasRules = tables.rows.some(r => r.table_name === 'discount_rules');
        if (hasRules) {
            console.log('Searching for KKT-RH8MBD in discount_rules...');
            const results = await db.execute(sql`SELECT * FROM discount_rules WHERE code LIKE '%KKT-RH8MBD%'`);
            console.log('Rule Matches:', results.rows);
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

run();
