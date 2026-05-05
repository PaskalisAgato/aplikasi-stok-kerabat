import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { inArray } from 'drizzle-orm';
async function checkPrices() {
    const r = await db.select({ id: schema.recipes.id, name: schema.recipes.name, price: schema.recipes.price }).from(schema.recipes).where(inArray(schema.recipes.id, [2, 7, 8, 19, 23]));
    console.log(r);
    process.exit(0);
}
checkPrices();
