import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        // 1. Check if Jesi's April 28 record still exists
        const existing = await client.query(`
            SELECT * FROM attendance 
            WHERE user_id = 'emp_2' 
            AND date >= '2026-04-28 00:00:00' 
            AND date < '2026-04-29 00:00:00'
        `);
        
        if (existing.rows.length > 0) {
            console.log("Record tanggal 28 masih ada:", existing.rows);
            console.log("Tidak perlu restore.");
        } else {
            console.log("Record tanggal 28 sudah dihapus. Melakukan restore...");
            
            // Restore based on data we captured earlier:
            // id: 115, check_in: 2026-04-28T01:05:07.876Z (08:05 WIB), status: Hadir
            const result = await client.query(`
                INSERT INTO attendance (user_id, date, check_in, status, check_in_timestamp, created_at)
                VALUES ('emp_2', '2026-04-28 00:00:00', '2026-04-28 01:05:07.876', 'Hadir', '08.05', NOW())
                RETURNING *
            `);
            console.log("✅ Berhasil restore data absen Jesi tanggal 28:", result.rows[0]);
        }
    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
