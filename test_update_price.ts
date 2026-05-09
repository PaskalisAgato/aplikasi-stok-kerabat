import { ProductService } from './backend/src/services/product.service.js';
import { db } from './backend/src/config/db.js';
import * as schema from './backend/src/db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env') });

async function testUpdate() {
    try {
        const [recipe] = await db.select().from(schema.recipes).limit(1);
        if (!recipe) {
            console.log("No recipes found to test.");
            return;
        }
        
        console.log(`Testing update for recipe: ${recipe.name} (ID: ${recipe.id})`);
        console.log(`Current price: ${recipe.price}, Current priceStand: ${recipe.priceStand}`);
        
        const testPriceStand = 77777;
        await ProductService.updateProduct(recipe.id, {
            name: recipe.name,
            category: recipe.category,
            price: parseFloat(recipe.price),
            priceStand: testPriceStand
        });
        
        const [updated] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, recipe.id)).limit(1);
        console.log(`Updated priceStand: ${updated.priceStand}`);
        
        if (parseFloat(updated.priceStand) === testPriceStand) {
            console.log("SUCCESS: priceStand updated correctly in DB.");
        } else {
            console.log("FAILURE: priceStand did NOT update correctly.");
        }
        
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        process.exit();
    }
}

testUpdate();
