import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        // Check if the ORIGINAL April 28 record (pre-TZ-fix, date = midnight UTC) exists
        const existing = await client.query(`
            SELECT id, date, check_in, status FROM attendance 
            WHERE user_id = 'emp_2' 
            AND date = '2026-04-28 00:00:00+00'
        `);

        if (existing.rows.length > 0) {
            console.log("Record April 28 (UTC midnight) masih ada:", existing.rows);
        } else {
            console.log("Record April 28 tidak ditemukan. Melakukan restore...");
            
            // Original data from id:115:
            // date: 2026-04-28T00:00:00.000Z, check_in: 2026-04-28T01:05:07.876Z (08:05 WIB), status: Hadir
            const result = await client.query(`
                INSERT INTO attendance (user_id, date, check_in, status, check_in_timestamp, 
                    location, latitude, longitude, created_at)
                VALUES (
                    'emp_2', 
                    '2026-04-28 00:00:00+00',
                    '2026-04-28 01:05:07.876+00',
                    'Hadir', 
                    '08.05',
                    'Jalan Ampera, Sungai Bangkong, Pontianak Kota, Pontianak, Kalimantan Barat, Kalimantan, 78115, Indonesia',
                    -0.0593110,
                    109.3068965,
                    '2026-04-28 01:05:07.876+00'
                )
                RETURNING id, date, check_in, status
            `);
            console.log("✅ Berhasil restore data absen Jesi tanggal 28:", result.rows[0]);
        }

        // Show all Jesi's attendance for verification
        const all = await client.query(`
            SELECT id, date, check_in, check_out, status, check_in_timestamp
            FROM attendance 
            WHERE user_id = 'emp_2' 
            ORDER BY date DESC LIMIT 5
        `);
        console.log("\nSemua data absen Jesi (terbaru):", all.rows);

    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
