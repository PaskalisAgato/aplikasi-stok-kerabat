import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, or, like } from 'drizzle-orm';

async function checkVoucher(code: string) {
    console.log(`Checking voucher: ${code}`);
    
    // Check Stand Vouchers
    const standMatches = await db.select().from(schema.standVouchers).where(like(schema.standVouchers.code, `${code}%`));
    console.log('Stand Voucher Matches:', standMatches);
    
    // Check Promo Vouchers
    const promoMatches = await db.select().from(schema.promoVouchers).where(like(schema.promoVouchers.code, `${code}%`));
    console.log('Promo Voucher Matches:', promoMatches);
    
    process.exit(0);
}

const target = process.argv[2] || 'KKT-RH8MBD';
checkVoucher(target);
