import { Pool } from 'pg';
import 'dotenv/config';

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const client = await pool.connect();
        console.log('Connected to database. Running migration...');
        
        await client.query(`
            ALTER TABLE todos 
            ADD COLUMN IF NOT EXISTS photo_upload_mode TEXT DEFAULT 'both';
        `);
        
        console.log('Migration successful: Column "photo_upload_mode" added to "todos" table.');
        client.release();
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

migrate();
