import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query(`ALTER TABLE recipes ADD COLUMN price_stand numeric(12, 2) NOT NULL DEFAULT '0';`);
        console.log("Successfully added 'price_stand' column to recipes table.");
    } catch (e: any) {
        if (e.code === '42701') {
            console.log("Column 'price_stand' already exists.");
        } else {
            console.error("Migration failed:", e);
        }
    } finally {
        client.release();
        pool.end();
    }
}
run();
