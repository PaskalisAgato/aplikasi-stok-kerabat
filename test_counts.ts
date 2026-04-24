import { db } from './backend/src/db/index.js';
import * as schema from './backend/src/db/schema.js';
import { desc, eq, gte, lte, and, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function query() {
    const startDate = "2026-04-01T00:00";
    const endDate = "2026-04-24T23:59";
    
    const filters = [eq(schema.expenses.isDeleted, false)];
    
    if (startDate) {
        const startStr = startDate.includes('T') ? startDate : `${startDate}T00:00:00+07:00`;
        const d = new Date(startStr);
        if (!isNaN(d.getTime())) filters.push(gte(schema.expenses.expenseDate, d));
    }
    if (endDate) {
        const endStr = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999+07:00`;
        const d = new Date(endStr);
        if (!isNaN(d.getTime())) filters.push(lte(schema.expenses.expenseDate, d));
    }
    
    const whereClause = and(...filters);
    
    const summaryResult = await db.select({
        count: sql<number>`COUNT(*)`
    })
    .from(schema.expenses)
    .where(whereClause);
    
    const allExpenses = await db.select({
        id: schema.expenses.id,
    })
    .from(schema.expenses)
    .where(whereClause)
    .orderBy(desc(schema.expenses.expenseDate), desc(schema.expenses.id));

    console.log(`Summary Count: ${summaryResult[0].count}`);
    console.log(`Export Array Length: ${allExpenses.length}`);
}

query().catch(console.error).finally(()=>process.exit(0));

