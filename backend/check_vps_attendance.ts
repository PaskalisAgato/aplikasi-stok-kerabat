import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        // 1. Find Jesi
        const users = await client.query(`SELECT id, name, role FROM "user" WHERE name ILIKE '%Jesi%'`);
        console.log("Users matching Jesi:", users.rows);

        // 2. Check today's attendance for ALL users
        const today = await client.query(`
            SELECT a.id, a.user_id, u.name, a.date, a.check_in, a.check_out, a.status 
            FROM attendance a 
            JOIN "user" u ON a.user_id = u.id 
            WHERE a.date >= CURRENT_DATE 
            AND a.date < CURRENT_DATE + INTERVAL '1 day'
            ORDER BY a.id DESC
        `);
        console.log("\nToday's attendance (all users):", today.rows);

        // 3. Latest 5 attendance records overall
        const latest = await client.query(`
            SELECT a.id, a.user_id, u.name, a.date, a.check_in, a.status 
            FROM attendance a 
            JOIN "user" u ON a.user_id = u.id 
            ORDER BY a.id DESC LIMIT 5
        `);
        console.log("\nLatest 5 attendance records:", latest.rows);

        // 4. Server time
        const time = await client.query(`SELECT NOW() as server_time, CURRENT_DATE as server_date`);
        console.log("\nServer time:", time.rows[0]);

    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
