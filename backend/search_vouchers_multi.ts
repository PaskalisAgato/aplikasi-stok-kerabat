import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

async function run() {
    console.log('--- Checking Multiple Databases for Voucher KKT-RH8MBD ---');
    
    const dbUrls = [
        "postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres", // Current Supabase
        "postgresql://postgres.naklryyhioikogvpcdxd:epizetkano356@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres", // Alt Supabase 1
        "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos" // VPS Local (not accessible from here but for reference)
    ];

    for (const url of dbUrls) {
        if (url.includes('localhost')) continue;
        
        console.log(`\nTesting DB: ${url.split('@')[1]}`);
        const pool = new pg.Pool({ connectionString: url });
        const db = drizzle(pool);

        try {
            const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
            const tableNames = tables.rows.map(r => r.table_name);
            console.log(`  Tables found: ${tableNames.length}`);

            const searchTables = ['promo_vouchers', 'stand_vouchers', 'discounts', 'discount_rules'];
            for (const table of searchTables) {
                if (tableNames.includes(table)) {
                    const col = table === 'discounts' ? 'name' : (table === 'discount_rules' ? 'code' : 'code');
                    const results = await db.execute(sql`SELECT * FROM ${sql.raw(table)} WHERE ${sql.raw(col)} LIKE 'KKT-RH8MBD%'`);
                    if (results.rows.length > 0) {
                        console.log(`  ✅ MATCH FOUND in ${table}!`);
                        console.log(results.rows);
                    } else {
                        console.log(`  - No match in ${table}`);
                    }
                }
            }
        } catch (e: any) {
            console.error(`  ❌ Error accessing this DB: ${e.message}`);
        } finally {
            await pool.end();
        }
    }
    process.exit(0);
}

run();
