import pg from 'pg';

const url = "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos";
const pool = new pg.Pool({ connectionString: url });

async function run() {
    try {
        const client = await pool.connect();
        console.log("Connected to VPS DB (local)");
        const res = await client.query('SELECT type, quantity, reason, created_at FROM stock_movements ORDER BY created_at DESC LIMIT 10');
        console.log("VPS Recent Movements:", res.rows);
        
        const audit = await client.query('SELECT action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10');
        console.log("VPS Recent Audit:", audit.rows);
        
        client.release();
    } catch (err) {
        console.error("VPS DB Error:", err);
    }
    process.exit(0);
}
run();
