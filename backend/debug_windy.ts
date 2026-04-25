import { Pool } from 'pg';
import 'dotenv/config';

async function check() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('--- Debugging Windy Sales ---');
        // Find Windy's user ID
        const uRes = await pool.query("SELECT id, name FROM \"user\" WHERE name ILIKE '%Windy%'");
        console.log('Users found:', uRes.rows);

        if (uRes.rows.length === 0) {
            console.log('User Windy not found.');
            return;
        }

        const windyId = uRes.rows[0].id;

        // Check active shift for Windy
        const shRes = await pool.query("SELECT * FROM shifts WHERE user_id = $1 AND status = 'OPEN' ORDER BY start_time DESC LIMIT 1", [windyId]);
        console.log('Active Shift:', shRes.rows[0]);

        if (shRes.rows.length > 0) {
            const shiftId = shRes.rows[0].id;
            // Check sales for this shift
            const sRes = await pool.query("SELECT id, total_amount, payment_method, status, is_voided, is_deleted, created_at FROM sales WHERE shift_id = $1", [shiftId]);
            console.log(`Sales for shift ${shiftId}:`, sRes.rows.length);
            if (sRes.rows.length > 0) {
                console.log('Sample sales:', sRes.rows.slice(0, 5));
            }
        } else {
            console.log('No active OPEN shift found for Windy.');
            // Check recently closed shift
            const shClosedRes = await pool.query("SELECT * FROM shifts WHERE user_id = $1 ORDER BY start_time DESC LIMIT 5", [windyId]);
            console.log('Recent shifts for Windy:', shClosedRes.rows.map(r => ({ id: r.id, status: r.status, start: r.start_time })));
        }

        // Check sales for Windy - ALL TIME
        const sAllRes = await pool.query("SELECT id, shift_id, total_amount, status, created_at FROM sales WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [windyId]);
        console.log(`Total sales for Windy (last 20):`, sAllRes.rows.length);
        console.log('Recent Windy sales:', sAllRes.rows.map(r => ({ id: r.id, shift: r.shift_id, amount: r.total_amount, time: r.created_at })));

        // Check sales for TODAY from ANY user
        const sTodayAnyRes = await pool.query("SELECT s.id, s.shift_id, s.total_amount, s.user_id, u.name, s.created_at FROM sales s JOIN \"user\" u ON s.user_id = u.id WHERE s.created_at >= CURRENT_DATE - 1 ORDER BY s.created_at DESC LIMIT 20");
        console.log(`Transactions since yesterday (any user):`, sTodayAnyRes.rows.length);
        console.log('Recent transactions from any user:', sTodayAnyRes.rows.map(r => ({ id: r.id, user: r.name, shift: r.shift_id, amount: r.total_amount, time: r.created_at })));

    } catch (err: any) {
        console.error('Check failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
