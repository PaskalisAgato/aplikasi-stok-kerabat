import { db } from '../db/index.js';
import { systemLogs } from '../db/schema.js';
import { desc, sql } from 'drizzle-orm';

async function performAudit() {
    console.log('--- 🚀 Enterprise Performance Audit ---');
    
    // 1. Top 5 Slowest Endpoints
    console.log('\n🐢 Top 5 Slowest Endpoints:');
    const slow = await db.select().from(systemLogs).orderBy(desc(systemLogs.responseTime)).limit(5);
    console.table(slow.map(l => ({
        method: l.method,
        path: l.path,
        latency: `${l.responseTime}ms`,
        size: `${(l.payloadSize/1024).toFixed(2)}KB`,
        status: l.statusCode,
        time: l.createdAt
    })));

    // 2. Top 5 Heaviest Payloads
    console.log('\n📦 Top 5 Heaviest Payloads:');
    const heavy = await db.select().from(systemLogs).orderBy(desc(systemLogs.payloadSize)).limit(5);
    console.table(heavy.map(l => ({
        method: l.method,
        path: l.path,
        size: `${(l.payloadSize/1024).toFixed(2)}KB`,
        latency: `${l.responseTime}ms`,
        status: l.statusCode,
        time: l.createdAt
    })));

    // 3. Most Frequent Requests
    console.log('\n🔄 Most Frequent Endpoints:');
    const frequent = await db.execute(sql`
        SELECT method, path, COUNT(*) as call_count, AVG(response_time)::int as avg_latency
        FROM system_logs
        GROUP BY method, path
        ORDER BY call_count DESC
        LIMIT 5
    `);
    console.table(frequent.rows);

    // 4. Total Egress per Day (Last 7 Days)
    console.log('\n📊 Daily Egress Trend:');
    const egressTrend = await db.execute(sql`
        SELECT DATE(created_at) as date, SUM(payload_size) / 1024 / 1024 as egress_mb, COUNT(*) as total_req
        FROM system_logs
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
    `);
    console.table(egressTrend.rows);
}

performAudit().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
