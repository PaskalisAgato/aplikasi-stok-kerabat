import { db } from './backend/src/db/index.js';
import { expenses } from './backend/src/db/schema.js';
import { desc } from 'drizzle-orm';

async function checkExpenses() {
    try {
        console.log('Checking last 10 expenses...');
        const lastExpenses = await db.query.expenses.findMany({
            orderBy: [desc(expenses.id)],
            limit: 10
        });

        lastExpenses.forEach(exp => {
            console.log(`ID: ${exp.id} | Title: ${exp.title} | hasReceipt: ${exp.receiptUrl ? 'YES' : 'NO'} | receiptUrl: ${exp.receiptUrl}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkExpenses();
