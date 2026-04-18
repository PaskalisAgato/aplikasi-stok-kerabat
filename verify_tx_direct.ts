import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const txId = parseInt(process.argv[2]);
    if (!txId) {
        console.error("Please provide transaction ID");
        process.exit(1);
    }

    console.log(`Checking Transaction #${txId} in Supabase...`);
    try {
        const res = await pool.query('SELECT id, "is_voided", "total_amount", "void_reason", "member_id", "points_earned", "points_used" FROM "sales" WHERE id = $1', [txId]);
        
        if (res.rows.length === 0) {
            console.error("Transaction not found");
        } else {
            console.log("Database Record:", res.rows[0]);
        }
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

check();
