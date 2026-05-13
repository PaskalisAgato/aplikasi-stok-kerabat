import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkVoucherConfig() {
    console.log("=== CHECKING VOUCHER TEMPLATE CONFIG ===");
    
    const templates = await db.select()
        .from(schema.discounts)
        .where(and(
            eq(schema.discounts.type, 'qr_voucher'),
            eq(schema.discounts.isActive, true)
        ));

    if (templates.length === 0) {
        console.log("❌ No active 'qr_voucher' template found!");
        return;
    }

    templates.forEach(t => {
        console.log(`\nTemplate: ${t.name}`);
        console.log(`ID: ${t.id}`);
        console.log(`Type: ${t.type}`);
        console.log(`Active: ${t.isActive}`);
        console.log(`Value: ${t.value}`);
        console.log(`StartDate: ${t.startDate}`);
        console.log(`EndDate: ${t.endDate}`);
        console.log(`Conditions: ${t.conditions}`);
        
        if (t.endDate) {
            const endDate = new Date(t.endDate);
            console.log(`Parsed EndDate: ${endDate.toLocaleString('id-ID')}`);
            console.log(`Is EndDate in future? ${endDate > new Date()}`);
        } else {
            console.log("⚠️ No EndDate set on this template.");
        }
    });

    process.exit(0);
}

checkVoucherConfig().catch(err => {
    console.error(err);
    process.exit(1);
});
