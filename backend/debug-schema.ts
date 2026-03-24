import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
    console.log('--- Exhaustive DB Schema Audit ---');
    const tables = [
        'user', 'inventory', 'suppliers', 'recipes', 'recipe_ingredients', 
        'sales', 'sale_items', 'expenses', 'attendance', 'todos', 
        'todo_completions', 'audit_logs', 'inventory_price_logs'
    ];
    
    for (const table of tables) {
        console.log(`\nTable: ${table}`);
        try {
            const columns = await db.execute(sql`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = ${table}
                ORDER BY ordinal_position
            `);
            if (columns.rows.length === 0) {
                console.warn(`[WARNING] Table ${table} does not exist in DB!`);
            } else {
                console.table(columns.rows);
            }
        } catch (e) {
            console.error(`Error checking table ${table}:`, e);
        }
    }
}

checkSchema().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
