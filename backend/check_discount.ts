import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkDiscount11() {
    try {
        const results = await db.select().from(schema.discounts).where(eq(schema.discounts.id, 11));
        console.log('--- DISCOUNT 11 STATUS ---');
        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Database Error:', e);
    }
    process.exit(0);
}

checkDiscount11().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
