import { pool } from '../db/index.js';
import 'dotenv/config';

async function checkIndexes() {
    console.log('--- 🛡️ Production Index Verification ---');
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT
                    t.relname AS table_name,
                    i.relname AS index_name,
                    a.attname AS column_name
                FROM
                    pg_class t,
                    pg_class i,
                    pg_index ix,
                    pg_attribute a
                WHERE
                    t.oid = ix.indrelid
                    AND i.oid = ix.indexrelid
                    AND a.attrelid = t.oid
                    AND a.attnum = ANY(ix.indkey)
                    AND t.relkind = 'r'
                    AND t.relname IN ('sales', 'expenses', 'stock_movements', 'idempotency_keys')
                ORDER BY
                    t.relname,
                    i.relname;
            `);
            console.table(result.rows);
        } finally {
            client.release();
        }
        process.exit(0);
    } catch (error: any) {
        console.error('FAILED check indexes:');
        console.error(error.message);
        process.exit(1);
    }
}

checkIndexes();
