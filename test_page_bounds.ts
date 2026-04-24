import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './backend/src/db/schema.js';
import { desc, eq, gte, lte, and, sql } from 'drizzle-orm';

async function query() {
    process.env.DATABASE_URL = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    const startDate = new Date("2026-03-01T00:00:00+07:00");
    const endDate = new Date("2026-04-24T23:59:59+07:00");

    const allExpenses = await db.select({
        id: schema.expenses.id,
        expenseDate: schema.expenses.expenseDate,
        title: schema.expenses.title
    })
    .from(schema.expenses)
    .where(and(
        eq(schema.expenses.isDeleted, false),
        gte(schema.expenses.expenseDate, startDate),
        lte(schema.expenses.expenseDate, endDate)
    ))
    .orderBy(desc(schema.expenses.expenseDate), desc(schema.expenses.id));

    let index19th = -1;
    let date19Found = false;

    for (let i = 0; i < allExpenses.length; i++) {
        // Find Local Time
        const expDate = allExpenses[i].expenseDate;
        // To WIB String
        const wib = new Date(expDate).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        if (wib.includes('19/4/2026') || wib.includes('19/04/2026') || wib.includes('19/')) {
            index19th = i;
            date19Found = true;
            break;
        }
    }

    console.log(`Total active items in date range: ${allExpenses.length}`);
    if (date19Found) {
        console.log(`The FIRST item from the 19th appears at OFFSET: ${index19th}`);
        if (index19th > 20) {
            console.log(`Therefore, it is on PAGE ${Math.ceil((index19th + 1) / 20)}`);
        }
    } else {
        console.log(`NO item found for the 19th in WIB timezone!`);
    }

    await pool.end();
}

query().catch(console.error);
