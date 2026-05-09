import 'dotenv/config';
import { sql, eq, isNotNull, and } from 'drizzle-orm';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';

async function restoreLegacyConditions() {
    console.log('[Migration] Restoring bundle logic and conditions to discount_rules...');
    try {
        await db.execute(sql`ALTER TABLE discount_rules ADD COLUMN IF NOT EXISTS "conditions" text`);
        console.log('[OK] Altered table discount_rules');
        const legacyPromos = await db.select().from(schema.discounts)
            .where(and(
                eq(schema.discounts.isActive, true),
                isNotNull(schema.discounts.voucherCode)
            ));

        for (const promo of legacyPromos) {
            if (promo.conditions || promo.type === 'bundling' || promo.type === 'buy_x_get_y') {
                const newType = promo.type === 'nominal' ? 'fixed' : 
                                (promo.type === 'percentage' || promo.type === 'percent') ? 'percentage' : promo.type;
                                
                await db.update(schema.discountRules)
                    .set({
                        conditions: promo.conditions,
                        type: newType,
                        value: promo.value // Resynchronize exactly just in case it got mapped as percentages
                    })
                    .where(eq(schema.discountRules.code, promo.voucherCode!));
                console.log(`[OK] Restored rules for ${promo.voucherCode} (Type: ${newType})`);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
restoreLegacyConditions();
