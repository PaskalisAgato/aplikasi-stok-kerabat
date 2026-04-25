import { Pool } from 'pg';
import 'dotenv/config';

async function fix() {
    const pool = new Pool({
        connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos",
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Fixing Windy Shift Data ---');
        
        const oldShiftId = 4;
        const newShiftId = 26;
        const windyId = 'ab00687f-c705-4a6c-92e0-21defac9626f';

        // 1. Move sales
        const sRes = await pool.query("UPDATE sales SET shift_id = $1 WHERE shift_id = $2 AND user_id = $3 AND created_at >= CURRENT_DATE", [newShiftId, oldShiftId, windyId]);
        console.log(`Updated ${sRes.rowCount} sales entries.`);

        // 2. Move cash_ledger entries
        const lRes = await pool.query("UPDATE cash_ledger SET shift_id = $1 WHERE shift_id = $2 AND reference_id IN (SELECT id FROM sales WHERE shift_id = $1)", [newShiftId, oldShiftId]);
        console.log(`Updated ${lRes.rowCount} ledger entries.`);

        // 3. Close the old stuck shift
        await pool.query("UPDATE shifts SET status = 'CLOSED', end_time = NOW() WHERE id = $1", [oldShiftId]);
        console.log(`Closed old shift ID ${oldShiftId}.`);

        console.log('Fix completed successfully.');

    } catch (err: any) {
        console.error('Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

fix();
