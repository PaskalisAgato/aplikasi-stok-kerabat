import { db, pool } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function fixAllSequences() {
    const tables = [
        'inventory', 'recipes', 'shifts', 'sales', 'sale_items', 'expenses', 'expense_categories', 'suppliers', 'audit_logs', 'work_shifts', 'attendance'
    ];
    
    console.log('--- 🛠️  Starting Database Sequence Maintenance ---');
    
    try {
        for (const table of tables) {
            try {
                // 1. Get the max ID from the table
                const maxIdResult = await db.execute(sql.raw(`SELECT MAX(id) FROM "${table}"`));
                const maxId = maxIdResult.rows[0].max || 0;
                
                // 2. Locate the sequence name associated with the 'id' column
                const seqNameResult = await db.execute(sql.raw(`
                    SELECT pg_get_serial_sequence('"${table}"', 'id') as seq
                `));
                const seqName = seqNameResult.rows[0].seq;
                
                if (seqName) {
                    console.log(`[${table}] Current Max ID: ${maxId}. Current Sequence: ${seqName}`);
                    
                    // 3. Reset the sequence to the Max ID
                    // Using setval(seq, maxId) will cause nextval() to return maxId + 1 (if the third param is true/default)
                    // If maxId is 0, we set it to 1 and is_called to false, so next is 1.
                    if (maxId === 0) {
                        await db.execute(sql.raw(`SELECT setval('${seqName}', 1, false)`));
                    } else {
                        await db.execute(sql.raw(`SELECT setval('${seqName}', ${maxId})`));
                    }
                    
                    const nextVal = (await db.execute(sql.raw(`SELECT nextval('${seqName}')`))).rows[0].nextval;
                    console.log(`✅ [${table}] Resynced! Next ID will be: ${nextVal}`);
                    
                    // IMPORTANT: nextval() increments the value, so we must decrement it back if we don't want to skip an ID, 
                    // or just accept that we skipped one during fix.
                    // Given this is a fix, skipping one ID (the one returned by nextval above) is acceptable to ensure it works.
                } else {
                    console.log(`[${table}] No serial sequence found for column 'id'. Skipping...`);
                }
            } catch (err: any) {
                console.error(`❌ [${table}] Error during resync: ${err.message}`);
            }
        }
        console.log('\n--- ✨ All sequences fixed! ---');
    } catch (globalErr: any) {
        console.error('--- 🚨 Global Error during sequence fix ---');
        console.error(globalErr.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixAllSequences();
