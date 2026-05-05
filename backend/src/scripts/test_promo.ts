import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { DiscountService } from '../services/discount.service.js';

async function testPromo() {
    try {
        console.log("Fetching discounts...");
        const discounts = await db.select().from(schema.discounts);
        const bundling = discounts.filter(d => d.type === 'bundling');
        console.log("Bundling promos from DB:", JSON.stringify(bundling, null, 2));

        if (bundling.length === 0) {
            console.log("No bundling promos exist!");
            process.exit(0);
        }

        // Gather target IDs from ALL bundling promos so we trigger them all
        const allTargetIds = new Set<number>();
        bundling.forEach(b => {
             const conditions = b.conditions ? JSON.parse(b.conditions) : null;
             if (conditions && conditions.productIds) {
                 conditions.productIds.map(Number).forEach(id => allTargetIds.add(id));
             }
        });
        const targetIds = Array.from(allTargetIds);
        console.log("Simulating cart with IDs:", targetIds);

        // Fetch mock prices from recipes
        const recipes = await db.select().from(schema.recipes);
        
        const cartItems = targetIds.map(id => {
            const r = recipes.find(rec => rec.id === id);
            return {
                recipeId: id,
                quantity: 1,
                price: r ? parseFloat(r.price as any) : 10000
            };
        });

        console.log("Testing DiscountService.evaluateDiscounts...");
        const result = await DiscountService.evaluateDiscounts(cartItems, undefined, undefined, undefined, 'DIRECT');
        console.log("Evaluation Result:", JSON.stringify(result, null, 2));

    } catch (e) {
        console.error("Test error:", e);
    }
    process.exit(0);
}

testPromo();
