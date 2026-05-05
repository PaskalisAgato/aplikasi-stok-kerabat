import { db } from '../db/index.js';
import * as schema from '../db/schema.js';

async function checkRecipes() {
    const res = await db.select({
        id: schema.recipes.id,
        name: schema.recipes.name,
        outletId: schema.recipes.outletId
    }).from(schema.recipes);
    
    console.table(res.slice(0, 20));
    console.log(`Total recipes found: ${res.length}`);
    process.exit(0);
}
checkRecipes();
