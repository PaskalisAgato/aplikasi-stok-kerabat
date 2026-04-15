import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { gte, count, eq, and } from 'drizzle-orm';

async function main() {
    const today = new Date();
    today.setHours(0,0,0,0);
    // Adjust for WIB if needed, but let's see server's today first
    
    console.log("=== SALES STATUS CHECK ===");
    const results = await db.select({
        status: schema.sales.status,
        count: count()
    })
    .from(schema.sales)
    .where(gte(schema.sales.createdAt, today))
    .groupBy(schema.sales.status);
    
    console.log(`Sales today (>= ${today.toISOString()}):`);
    console.log(results);

    process.exit(0);
}
main();
