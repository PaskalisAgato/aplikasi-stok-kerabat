import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        const recipeRes = await client.query(`SELECT id, name FROM recipes WHERE name ILIKE '%teh panas%' LIMIT 1`);
        if (recipeRes.rows.length === 0) {
            console.log("Teh Panas not found.");
            return;
        }
        const recipeId = recipeRes.rows[0].id;
        
        const boms = await client.query(`
            SELECT ri.quantity as qty, i.name as inv_name, i.price_per_unit, i.unit 
            FROM recipe_ingredients ri
            JOIN inventory i ON ri.inventory_id = i.id
            WHERE ri.recipe_id = $1
        `, [recipeId]);

        console.log(`=== RECIPE: ${recipeRes.rows[0].name} (ID: ${recipeId}) ===`);
        console.table(boms.rows);
    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
