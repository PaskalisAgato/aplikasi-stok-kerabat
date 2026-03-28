
import { db } from './src/db/index.js';
import { todos, todoCompletions } from './src/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

async function testHistory() {
    try {
        const limit = 10;
        const offset = 0;

        const onceOffQuery = db.select({
            id: todos.id,
            title: todos.title,
            completionTime: todos.completionTime,
        })
        .from(todos)
        .where(and(eq(todos.status, 'Completed'), eq(todos.isRecurring, false)));

        const recurringQuery = db.select({
            id: todoCompletions.todoId,
            title: todos.title,
            completionTime: todoCompletions.completionTime,
        })
        .from(todoCompletions)
        .innerJoin(todos, eq(todoCompletions.todoId, todos.id));

        console.log('Testing union query...');
        const rawResponse = await db.execute(sql`
            SELECT * FROM (${onceOffQuery.unionAll(recurringQuery)}) AS combined
            ORDER BY combined.completion_time DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `);
        const rows = (rawResponse as any).rows || rawResponse; // Handle different drizzle-orm/pg versions
        console.log('Success! Rows found:', rows.length);
        if (rows.length > 0) {
            console.log('First row (keys):', Object.keys(rows[0]));
            // Also print example row
            console.log('Example row fields:', JSON.stringify(rows[0]).substring(0, 200));
        }
    } catch (error) {
        console.error('Query failed:', error);
    } finally {
        process.exit();
    }
}

testHistory();
