import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function ensureIndexes() {
    console.log('--- Ensuring Enterprise Performance Indexes ---');

    const indexStatements = [
        // Inventory
        `CREATE INDEX IF NOT EXISTS inventory_created_at_idx ON inventory (created_at)`,
        
        // Expenses
        `CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON expenses (created_at)`,
        `CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses (user_id)`,
        
        // Sales
        `CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales (created_at)`,
        `CREATE INDEX IF NOT EXISTS sales_user_id_idx ON sales (user_id)`,
        
        // Stock Movements
        `CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON stock_movements (created_at)`,
        `CREATE INDEX IF NOT EXISTS stock_movements_inventory_id_idx ON stock_movements (inventory_id)`,
        
        // Audit Logs
        `CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at)`,
        `CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs (user_id)`,
        
        // System Logs
        `CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON system_logs (created_at)`,
        
        // Attendance
        `CREATE INDEX IF NOT EXISTS attendance_created_at_idx ON attendance (created_at)`,
        
        // To-dos
        `CREATE INDEX IF NOT EXISTS todos_created_at_idx ON todos (created_at)`
    ];

    for (const statement of indexStatements) {
        try {
            console.log(`Executing: ${statement}`);
            await db.execute(sql.raw(statement));
        } catch (err) {
            console.error(`Failed to execute index statement: ${statement}`, err);
        }
    }

    console.log('--- Indexing Completed ---');
}

ensureIndexes().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
