import pg from 'pg';

const url = "postgresql://postgres.naklryyhioikogvpcdxd:epizetkano356@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";
const pool = new pg.Pool({ connectionString: url });

async function run() {
    try {
        const client = await pool.connect();
        console.log("Connected to Alt DB");
        const res = await client.query('SELECT created_at FROM stock_movements ORDER BY created_at DESC LIMIT 5');
        console.log("Alt DB Recent Movements:", res.rows);
        
        const audit = await client.query('SELECT action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5');
        console.log("Alt DB Recent Audit:", audit.rows);
        
        client.release();
    } catch (err) {
        console.error("Alt DB Error:", err);
    }
    process.exit(0);
}
run();
