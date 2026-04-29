import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT name, category, cost_price, price 
            FROM recipes 
            WHERE category ILIKE '%minuman%' OR category ILIKE '%drink%'
            ORDER BY name;
        `);
        console.log("=== HPP (MODAL) MINUMAN ===");
        console.table(result.rows);
    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
