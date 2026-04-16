// scripts/debug-freshmilk.ts
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function check() {
    const milk = await db.select().from(schema.inventory).where(eq(schema.inventory.id, 3));
    console.log("Fresh Milk:", milk);
    process.exit(0);
}
check().catch(console.error);
