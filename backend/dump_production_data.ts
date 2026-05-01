import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';

async function run() {
    try {
        console.log("--- Production Discounts Dump ---");
        const discounts = await db.select().from(schema.discounts).where(schema.discounts.isActive);
        discounts.forEach(d => {
            console.log(`ID: ${d.id} | Name: ${d.name} | Type: ${d.type} | Conditions: ${d.conditions}`);
        });
        
        console.log("\n--- Production Recipes (Teh Tarik / Kopi Susu) ---");
        const recipes = await db.select().from(schema.recipes);
        recipes.filter(r => r.name.includes('Teh Tarik') || r.name.includes('Kopi Susu'))
               .forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Price: ${r.price}`));

    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
