import 'dotenv/config';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function debugVouchers() {
    console.log('\n--- Active QR Template ---');
    const templates = await db.select().from(schema.discounts)
        .where(eq(schema.discounts.type, 'qr_voucher'))
        .limit(1);
    
    if (templates.length > 0) {
        console.log('ID:', templates[0].id);
        console.log('Name:', templates[0].name);
        console.log('Conditions:', templates[0].conditions);
    } else {
        console.log('No qr_voucher template found.');
    }
    
    process.exit(0);
}
debugVouchers();
