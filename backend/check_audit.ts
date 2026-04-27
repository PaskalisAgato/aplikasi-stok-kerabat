import { sql } from 'drizzle-orm';
import { db } from './src/db/index.js';
import * as schema from './src/db/schema.js';
import { desc, like } from 'drizzle-orm';

async function run() {
    try {
        const res = await db.select()
          .from(schema.auditLogs)
          .where(like(schema.auditLogs.action, '%OPNAME%'))
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(10);
        console.log(res);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
run();
