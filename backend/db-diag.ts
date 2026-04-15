import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function main() {
    console.log("=== DB DIAGNOSTIC ===");
    console.log("Current Server Time:", new Date().toString());
    
    const activeShifts = await db.select().from(schema.shifts).where(eq(schema.shifts.status, 'OPEN'));
    console.log("\nActive Shifts (status = OPEN):", activeShifts.length);
    for(let s of activeShifts) {
        console.log(`- ID: ${s.id}, UserId: ${s.userId}, Start: ${s.startTime}, InitialCash: ${s.initialCash}`);
    }

    const latestShifts = await db.select().from(schema.shifts).orderBy(desc(schema.shifts.id)).limit(5);
    console.log("\nLatest 5 Shifts (any status):");
    for(let s of latestShifts) {
        console.log(`- ID: ${s.id}, Status: ${s.status}, Start: ${s.startTime}, End: ${s.endTime}`);
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const todaySales = await db.select().from(schema.sales).where(schema.sales.createdAt >= today);
    console.log(`\nSales created >= ${today.toISOString()} (Server Today):`, todaySales.length);

    process.exit(0);
}
main();
