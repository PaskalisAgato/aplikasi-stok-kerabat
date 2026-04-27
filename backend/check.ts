import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { desc, inArray } from 'drizzle-orm';

async function run() {
    try {
        const res = await db.select()
          .from(schema.stockMovements)
          .where(inArray(schema.stockMovements.type, ['OPNAME_WASTE', 'OPNAME_IN', 'OPNAME_ADJUSTMENT']))
          .orderBy(desc(schema.stockMovements.createdAt))
          .limit(10);
        console.log(res);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
