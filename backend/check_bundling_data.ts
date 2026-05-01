import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { ilike, or } from 'drizzle-orm';

async function run() {
    try {
        const recipes = await db.select().from(schema.recipes).where(
            or(
                ilike(schema.recipes.name, '%Teh Tarik%'),
                ilike(schema.recipes.name, '%Kopi Susu%')
            )
        );
        console.log("Recipes found:");
        recipes.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Price: ${r.price}`));
        
        const bundlingPromos = await db.select().from(schema.discounts).where(schema.discounts.type === 'bundling');
        console.log("\nBundling Promos:");
        bundlingPromos.forEach(p => console.log(`ID: ${p.id} | Name: ${p.name} | Conditions: ${p.conditions}`));
        
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
