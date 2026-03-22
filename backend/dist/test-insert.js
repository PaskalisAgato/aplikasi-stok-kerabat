import { db } from './config/db.js';
import * as schema from './db/schema.js';
import { sql } from 'drizzle-orm';
async function test() {
    try {
        console.log("Testing insert...");
        const [newSale] = await db.insert(schema.sales).values({
            shiftId: sql `NULL`,
            userId: 'admin_primary',
            subTotal: '30000',
            taxAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: '30000',
            paymentMethod: 'CASH'
        }).returning();
        console.log("Insert success:", newSale);
    }
    catch (e) {
        console.error("DB ERROR DETAILS:");
        console.error(e.code);
        console.error(e.detail);
        console.error(e.message);
        console.error(e);
    }
    process.exit(0);
}
test();
