import 'dotenv/config';
import { pool } from './src/config/db.js';

async function fix() {
    const client = await pool.connect();
    try {
        await client.query('ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS hash TEXT');
        console.log('Column hash added to audit_logs');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit(0);
    }
}
fix();
