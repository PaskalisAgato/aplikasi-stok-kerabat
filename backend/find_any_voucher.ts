import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function run() {
    const searchCode = 'KKT-RH8MBD';
    console.log(`--- Searching for "${searchCode}" in ALL tables ---`);

    try {
        // 1. Check promo_vouchers
        const promo = await db.execute(sql`SELECT code, status, 'promo' as source FROM promo_vouchers WHERE code LIKE ${searchCode + '%'}`);
        if (promo.rows.length > 0) console.log('Found in promo_vouchers:', promo.rows);

        // 2. Check stand_vouchers
        const stand = await db.execute(sql`SELECT code, status, 'stand' as source FROM stand_vouchers WHERE code LIKE ${searchCode + '%'}`);
        if (stand.rows.length > 0) console.log('Found in stand_vouchers:', stand.rows);

        // 3. Check discount_rules
        const rules = await db.execute(sql`SELECT code, name, 'rule' as source FROM discount_rules WHERE code LIKE ${searchCode + '%'}`);
        if (rules.rows.length > 0) console.log('Found in discount_rules:', rules.rows);

        // 4. Just list latest 20 of everything to see what's going on
        const allPromo = await db.execute(sql`SELECT code, created_at FROM promo_vouchers ORDER BY created_at DESC LIMIT 10`);
        console.log('\nLatest 10 Promo Vouchers in DB:');
        allPromo.rows.forEach(r => console.log(` - ${r.code} (${r.created_at})`));

        if (promo.rows.length === 0 && stand.rows.length === 0 && rules.rows.length === 0) {
            console.log('\n❌ Tidak ditemukan kecocokan untuk "KKT-RH8MBD" di database VPS.');
        }

    } catch (e) {
        console.error('Search failed:', e);
    }
    process.exit(0);
}

run();
