import { pool } from './db/index.js';
import 'dotenv/config';
async function checkLocks() {
    console.log('Checking database locks and active sessions...');
    try {
        const client = await pool.connect();
        try {
            // Query for active locks and what they are waiting for
            const query = `
                SELECT 
                    pid, 
                    now() - query_start AS duration, 
                    wait_event_type, 
                    wait_event, 
                    state, 
                    query 
                FROM pg_stat_activity 
                WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%'
                ORDER BY duration DESC;
            `;
            const result = await client.query(query);
            console.log('--- Active Queries ---');
            console.table(result.rows);
            const lockQuery = `
                SELECT 
                    blocked_locks.pid AS blocked_pid,
                    blocked_activity.query AS blocked_query,
                    blocking_locks.pid AS blocking_pid,
                    blocking_activity.query AS blocking_query
                FROM pg_catalog.pg_locks blocked_locks
                JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
                JOIN pg_catalog.pg_locks blocking_locks 
                    ON blocking_locks.locktype = blocked_locks.locktype
                    AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
                    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                    AND blocking_locks.pid != blocked_locks.pid
                JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
                WHERE NOT blocked_locks.granted;
            `;
            const locks = await client.query(lockQuery);
            console.log('--- Blocked Locks ---');
            console.table(locks.rows);
        }
        finally {
            client.release();
        }
        process.exit(0);
    }
    catch (error) {
        console.error('FAILED to check locks:');
        console.error(error.message);
        process.exit(1);
    }
}
checkLocks();
