import 'dotenv/config';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function debugVouchers() {
    console.log('\n--- Inspecting Discount ID 11 ---');
    const [template] = await db.select().from(schema.discounts).where(eq(schema.discounts.id, 11)).limit(1);
    if (template) {
        console.table([template]);
    } else {
        console.log('Discount ID 11 not found.');
    }

    console.log('\n--- Inspecting All Discount Rules ---');
    const rules = await db.select().from(schema.discountRules);
    console.table(rules);

    process.exit(0);
}
debugVouchers();
