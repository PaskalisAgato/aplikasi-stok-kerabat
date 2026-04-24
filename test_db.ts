import { db } from './backend/src/db/index.js';
import * as schema from './backend/src/db/schema.js';
import { and, desc, sql } from 'drizzle-orm';

async function check() {
    const rawExpenses = await db.select({
        id: schema.expenses.id,
        expenseDate: schema.expenses.expenseDate,
        title: schema.expenses.title
    })
    .from(schema.expenses)
    .where(sql`${schema.expenses.isDeleted} = false`)
    .orderBy(desc(schema.expenses.expenseDate), desc(schema.expenses.id));

    console.log(`Total DB count (isDeleted=false): ${rawExpenses.length}`);
    if (rawExpenses.length > 0) {
        console.log(`Earliest date: ${rawExpenses[rawExpenses.length - 1].expenseDate}`);
        console.log(`Latest date: ${rawExpenses[0].expenseDate}`);
    }
}
check().catch(console.error).finally(() => process.exit(0));
