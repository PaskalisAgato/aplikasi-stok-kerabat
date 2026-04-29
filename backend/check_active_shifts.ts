import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        const shifts = await client.query(`
            SELECT s.id, s.user_id, u.name, s.start_time, s.status, s.initial_cash 
            FROM shifts s 
            JOIN "user" u ON s.user_id = u.id 
            WHERE s.status = 'OPEN'
        `);
        console.log("Active Shifts:", shifts.rows);
    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
