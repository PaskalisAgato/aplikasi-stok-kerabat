import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './backend/src/db/schema.js';
import { desc, eq, gte, lte, and, sql } from 'drizzle-orm';

async function query() {
    process.env.DATABASE_URL = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    const startDate = "2026-03-01T00:00";
    const endDate = "2026-04-24T23:59";
    
    const filters = [eq(schema.expenses.isDeleted, false)];
    
    if (startDate) {
        const startStr = startDate.includes('T') ? startDate : `${startDate}T00:00:00+07:00`;
        const d = new Date(startStr);
        filters.push(gte(schema.expenses.expenseDate, d));
    }
    if (endDate) {
        const endStr = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999+07:00`;
        const d = new Date(endStr);
        filters.push(lte(schema.expenses.expenseDate, d));
    }
    
    const whereClause = and(...filters);
    
    const summaryResult = await db.select({
        count: sql<number>`COUNT(*)`
    })
    .from(schema.expenses)
    .where(whereClause);
    
    console.log(`Summary Count: ${summaryResult[0].count}`);
    
    const count19th = await db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.expenses)
    .where(and(eq(schema.expenses.isDeleted, false), gte(schema.expenses.expenseDate, new Date('2026-04-18T17:00:00Z')), lte(schema.expenses.expenseDate, new Date('2026-04-19T17:00:00Z'))));
    console.log(`Count strictly on the 19th: ${count19th[0].count}`);

    await pool.end();
}

query().catch(console.error);
