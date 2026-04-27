import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { desc } from 'drizzle-orm';

async function run() {
    try {
        const res = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            currentStock: schema.inventory.currentStock,
            version: schema.inventory.version
        })
          .from(schema.inventory)
          .orderBy(desc(schema.inventory.version))
          .limit(10);
        console.log(res);
        
        const audit = await db.select()
          .from(schema.auditLogs)
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(10);
        console.log("Recent Audit Logs:", audit);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
