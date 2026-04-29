import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        const migrations = [
            {
                label: "order_source in sales",
                sql: `ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_source TEXT NOT NULL DEFAULT 'DIRECT';`
            },
            {
                label: "discount_ids in sales",
                sql: `ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_ids TEXT;`
            }
        ];

        for (const m of migrations) {
            await client.query(m.sql);
            console.log(`✅  OK: ${m.label}`);
        }
        console.log("Migrasi selesai!");
    } catch (e: any) {
        console.error("❌  Gagal:", e.message);
    } finally {
        client.release();
        pool.end();
    }
}
run();
