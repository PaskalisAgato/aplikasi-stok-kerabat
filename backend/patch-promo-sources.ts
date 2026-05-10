import 'dotenv/config';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function patchPromoSources() {
    console.log('--- Patching Promo Redemption Sources ---');
    
    // 1. Find the qr_voucher template
    const templates = await db.select().from(schema.discounts)
        .where(eq(schema.discounts.type, 'qr_voucher'))
        .limit(1);
    
    if (templates.length === 0) {
        console.log('No qr_voucher template found to patch.');
        process.exit(0);
    }
    
    const template = templates[0];
    const conditions = template.conditions ? JSON.parse(template.conditions) : {};
    
    // 2. Add 'DIRECT' to orderSources if not already there
    const currentSources = conditions.orderSources || [];
    if (!currentSources.includes('DIRECT')) {
        console.log(`Current sources: ${JSON.stringify(currentSources)}`);
        conditions.orderSources = [...new Set([...currentSources, 'DIRECT', 'STAND'])];
        console.log(`Updating to: ${JSON.stringify(conditions.orderSources)}`);
        
        await db.update(schema.discounts)
            .set({ conditions: JSON.stringify(conditions) })
            .where(eq(schema.discounts.id, template.id));
            
        console.log('SUCCESS: Promo template updated to allow DIRECT redemption.');
    } else {
        console.log('Template already allows DIRECT redemption.');
    }
    
    process.exit(0);
}

patchPromoSources().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
});
