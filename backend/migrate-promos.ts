import 'dotenv/config';
import { eq, isNotNull, and } from 'drizzle-orm';
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';

async function migrateLegacyPromos() {
    console.log('[Migration] Starting migration of legacy promos into discount_rules...');
    try {
        // Fetch all active legacy discounts that have a barcode/voucherCode
        const legacyPromos = await db.select().from(schema.discounts)
            .where(and(
                eq(schema.discounts.isActive, true),
                isNotNull(schema.discounts.voucherCode)
            ));

        console.log(`[Migration] Found ${legacyPromos.length} active legacy promos with barcodes.`);

        let insertedCount = 0;
        for (const promo of legacyPromos) {
            try {
                // Parse old conditions block
                let maxDiscount = null;
                let usageLimit = promo.totalQuota || null;
                if (promo.conditions) {
                    try {
                        const parsed = JSON.parse(promo.conditions);
                        if (parsed.maxDiscount) maxDiscount = parsed.maxDiscount;
                    } catch (e) {}
                }

                const mappedType = promo.type === 'nominal' ? 'fixed' : 'percentage';

                // Insert into new engine table
                await db.insert(schema.discountRules).values({
                    code: promo.voucherCode!,
                    type: mappedType,
                    value: promo.value,
                    minPurchase: promo.minPurchase || '0',
                    maxDiscount: maxDiscount ? maxDiscount.toString() : null,
                    usageLimit: usageLimit,
                    usedCount: promo.usedQuota || 0,
                    active: true,
                    stackable: false,
                    configVersion: 1
                });
                insertedCount++;
                console.log(`[OK] Migrated ${promo.voucherCode}`);
            } catch (err: any) {
                // Ignore duplicates if already migrated
                if (err.message.includes('unique constraint') || err.message.includes('duplicate key')) {
                    console.log(`[SKIP] Promo ${promo.voucherCode} already exists in discount_rules.`);
                } else {
                    console.log(`[ERROR] Failed to migrate ${promo.voucherCode}: ${err.message}`);
                }
            }
        }

        console.log(`\n[Migration Complete] Successfully migrated ${insertedCount} promos.`);
        
        // Also create a guaranteed test promo
        try {
            await db.insert(schema.discountRules).values({
                code: 'KERABAT2026',
                type: 'fixed',
                value: '15000',
                minPurchase: '50000',
                usageLimit: 100,
                usedCount: 0,
                active: true,
                stackable: false,
                configVersion: 1
            });
            console.log(`[OK] Created Master Test Promo: KERABAT2026 (Potongan Rp15.000, Min Beli Rp50.000)`);
        } catch(e) {}
        
        process.exit(0);
    } catch (err) {
        console.error('[Fatal Error]', err);
        process.exit(1);
    }
}

migrateLegacyPromos();
