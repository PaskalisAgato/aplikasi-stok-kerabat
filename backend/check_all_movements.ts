import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { desc } from 'drizzle-orm';

async function run() {
    try {
        const count = await db.select({ count: sql<number>`count(*)` }).from(schema.stockMovements);
        console.log("Total movements:", count[0].count);
        
        const res = await db.select()
          .from(schema.stockMovements)
          .orderBy(desc(schema.stockMovements.id))
          .limit(20);
        console.log(res);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
