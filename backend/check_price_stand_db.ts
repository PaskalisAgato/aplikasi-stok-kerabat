import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('backend/.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    const client = await pool.connect();
    try {
        console.log("Connected to database:", process.env.DATABASE_URL?.split('@')[1]);
        
        const { rows: columns } = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'recipes' 
            AND column_name = 'price_stand';
        `);
        
        if (columns.length > 0) {
            console.log("Column 'price_stand' EXISTS.");
            console.table(columns);
            
            const { rows: data } = await client.query('SELECT name, price, price_stand FROM recipes WHERE price_stand IS NOT NULL AND price_stand > 0 LIMIT 5;');
            console.log("Samples with price_stand > 0:");
            console.table(data);
        } else {
            console.log("Column 'price_stand' DOES NOT EXIST in the 'recipes' table.");
            
            // Check all columns in recipes to see if it's named something else
            const { rows: allColumns } = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'recipes';
            `);
            console.log("Current columns in 'recipes' table:");
            console.log(allColumns.map(c => c.column_name).join(', '));
        }
    } catch (e) {
        console.error("Check failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}
check();
