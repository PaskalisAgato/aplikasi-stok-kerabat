import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { gt } from 'drizzle-orm';

async function run() {
    try {
        const res = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            price: schema.inventory.pricePerUnit
        })
          .from(schema.inventory)
          .where(gt(schema.inventory.pricePerUnit, '0'))
          .limit(10);
        console.log("Items with price > 0:", res);
        
        const zeroPrice = await db.select({ count: sql<number>`count(*)` })
          .from(schema.inventory)
          .where(sql`${schema.inventory.pricePerUnit} = '0'`);
        console.log("Items with price = 0:", zeroPrice[0].count);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
