import { Client } from 'pg';

async function migrate() {
    const supabaseClient = new Client({
        connectionString: "postgresql://postgres:epizetkano356@db.lvfqfynqzgxjbkotlccp.supabase.co:5432/postgres"
    });

    const vpsClient = new Client({
        connectionString: "postgresql://kerabatuser:pos789Secure!@38.47.180.235:5432/kerabatpos"
    });

    try {
        await supabaseClient.connect();
        await vpsClient.connect();

        console.log('✅ Connected to both databases.');

        // 1. Migrate Members
        console.log('--- Migrating Members ---');
        const { rows: members } = await supabaseClient.query('SELECT * FROM members');
        console.log(`Found ${members.length} members.`);

        for (const m of members) {
            await vpsClient.query(
                `INSERT INTO members (id, name, phone, email, points, level, is_active, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    phone = EXCLUDED.phone, 
                    points = EXCLUDED.points,
                    level = EXCLUDED.level`,
                [m.id, m.name, m.phone, m.email, m.points, m.level, m.is_active, m.created_at]
            ).catch(e => console.error(`Error migrating member ${m.id}:`, e.message));
        }

        // 2. Migrate Discounts
        console.log('--- Migrating Discounts ---');
        const { rows: discounts } = await supabaseClient.query('SELECT * FROM discounts');
        console.log(`Found ${discounts.length} discounts.`);

        for (const d of discounts) {
            await vpsClient.query(
                `INSERT INTO discounts (id, name, type, value, conditions, is_active, start_date, end_date, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (id) DO UPDATE SET 
                    name = EXCLUDED.name, 
                    type = EXCLUDED.type, 
                    value = EXCLUDED.value,
                    conditions = EXCLUDED.conditions`,
                [d.id, d.name, d.type, d.value, d.conditions, d.is_active, d.start_date, d.end_date, d.created_at]
            ).catch(e => console.error(`Error migrating discount ${d.id}:`, e.message));
        }

        console.log('🚀 Migration completed!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await supabaseClient.end();
        await vpsClient.end();
    }
}

migrate();
