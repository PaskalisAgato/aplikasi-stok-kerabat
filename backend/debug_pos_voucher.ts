import { db } from './src/config/db.js';
import { sql, eq, and, inArray } from 'drizzle-orm';
import * as schema from './src/db/schema.js';
import { DiscountService } from './src/services/discount.service.js';

async function debug() {
    const voucherCode = 'KKT-DSL5ZW-31';
    console.log(`\n=== DEBUGGING VOUCHER: ${voucherCode} ===`);

    try {
        // 1. Get Voucher Data
        const [voucher] = await db.select()
            .from(schema.promoVouchers)
            .where(eq(schema.promoVouchers.code, voucherCode))
            .limit(1);

        if (!voucher) {
            console.log('❌ Voucher tidak ditemukan di tabel promo_vouchers.');
            return;
        }
        console.log('✅ Voucher Found:', {
            code: voucher.code,
            menuName: voucher.menuName,
            status: voucher.status,
            batchId: voucher.batchId
        });

        // 2. Get Batch Data
        const [batch] = await db.select()
            .from(schema.promoVoucherBatches)
            .where(eq(schema.promoVoucherBatches.id, voucher.batchId))
            .limit(1);
        
        console.log('✅ Batch Info:', {
            promoName: batch?.promoName,
            menuName: batch?.menuName
        });

        // 3. Search target item in recipes
        const targetMenu = voucher.menuName || batch?.menuName;
        console.log(`\n--- Searching for Recipes matching "${targetMenu}" ---`);
        const matchingRecipes = await db.select()
            .from(schema.recipes)
            .where(sql`name ILIKE ${'%' + targetMenu + '%'}`);
        
        if (matchingRecipes.length === 0) {
            console.log('❌ TIDAK DITEMUKAN recipe dengan nama tersebut!');
        } else {
            console.log(`✅ Found ${matchingRecipes.length} matching recipes:`);
            matchingRecipes.forEach(r => console.log(` - ID: ${r.id} | Name: ${r.name} | Category: ${r.category} | Price: ${r.price}`));
        }

        // 4. Simulate Evaluation
        if (matchingRecipes.length > 0) {
            const testRecipe = matchingRecipes[0];
            console.log(`\n--- Simulating POS Evaluation for ID ${testRecipe.id} ---`);
            
            const cartItems = [{
                recipeId: testRecipe.id,
                quantity: 1,
                price: Number(testRecipe.price)
            }];

            try {
                const results = await DiscountService.evaluateDiscounts(
                    cartItems as any,
                    undefined,
                    undefined,
                    voucherCode,
                    'STAND'
                );
                console.log('✅ Evaluation Results:', JSON.stringify(results, null, 2));
                
                if (results.length === 0) {
                    console.log('❌ Evaluation returned NO discounts.');
                } else if (results.some(r => r.voucherCode === voucherCode)) {
                    console.log('🎉 SUCCESS: Voucher applies correctly in logic.');
                }
            } catch (err: any) {
                console.log('❌ Evaluation FAILED with error:', err.message);
            }
        }

    } catch (e: any) {
        console.error('Debug script failed:', e);
    }
    process.exit(0);
}

debug();
