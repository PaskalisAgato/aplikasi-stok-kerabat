import { Client } from 'pg';

async function migrate() {
    const supabaseClient = new Client({
        connectionString: "postgresql://postgres:epizetkano356@db.lvfqfynqzgxjbkotlccp.supabase.co:5432/postgres" // Old Render/Supabase DB
    });

    const vpsClient = new Client({
        connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos" // New VPS DB
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
        
        // Fix sequences for members
        if (members.length > 0) {
            const maxMemberId = Math.max(...members.map(m => m.id));
            await vpsClient.query(`SELECT setval('members_id_seq', ${maxMemberId})`);
            console.log(`Reset members ID sequence to ${maxMemberId}`);
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

        // Fix sequences for discounts
        if (discounts.length > 0) {
            const maxDiscountId = Math.max(...discounts.map(d => d.id));
            await vpsClient.query(`SELECT setval('discounts_id_seq', ${maxDiscountId})`);
            console.log(`Reset discounts ID sequence to ${maxDiscountId}`);
        }

        // 3. Migrate Promo Voucher Batches
        console.log('--- Migrating Promo Voucher Batches ---');
        try {
            const { rows: batches } = await supabaseClient.query('SELECT * FROM promo_voucher_batches');
            console.log(`Found ${batches.length} batches.`);
            for (const b of batches) {
                await vpsClient.query(
                    `INSERT INTO promo_voucher_batches (id, template_id, promo_name, quantity, created_at, created_by) 
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (id) DO UPDATE SET promo_name = EXCLUDED.promo_name`,
                    [b.id, b.template_id, b.promo_name, b.quantity, b.created_at, b.created_by]
                ).catch(e => console.error(`Error migrating batch ${b.id}:`, e.message));
            }
        } catch (e) {
            console.warn('⚠️ Skip Migrating Promo Voucher Batches:', e.message);
        }

        // 4. Migrate Promo Vouchers
        console.log('--- Migrating Promo Vouchers ---');
        try {
            const { rows: promos } = await supabaseClient.query('SELECT * FROM promo_vouchers');
            console.log(`Found ${promos.length} promo vouchers.`);
            for (const p of promos) {
                await vpsClient.query(
                    `INSERT INTO promo_vouchers (id, batch_id, code, status, menu_name, normal_price, voucher_price, discount_nominal, expires_at, redeemed_at, redeemed_transaction_id, created_at) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    ON CONFLICT (code) DO UPDATE SET status = EXCLUDED.status`,
                    [p.id, p.batch_id, p.code, p.status, p.menu_name, p.normal_price, p.voucher_price, p.discount_nominal, p.expires_at, p.redeemed_at, p.redeemed_transaction_id, p.createdAt || p.created_at]
                ).catch(e => console.error(`Error migrating promo ${p.code}:`, e.message));
            }
        } catch (e) {
            console.warn('⚠️ Skip Migrating Promo Vouchers:', e.message);
        }

        // 5. Migrate Stand Vouchers (Legacy fallback)
        console.log('--- Migrating Stand Vouchers ---');
        try {
            const { rows: stands } = await supabaseClient.query('SELECT * FROM stand_vouchers');
            console.log(`Found ${stands.length} stand vouchers.`);
            for (const s of stands) {
                await vpsClient.query(
                    `INSERT INTO stand_vouchers (id, template_id, code, status, created_at) 
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (code) DO UPDATE SET status = EXCLUDED.status`,
                    [s.id, s.template_id, s.code, s.status, s.createdAt || s.created_at]
                ).catch(e => console.error(`Error migrating stand voucher ${s.code}:`, e.message));
            }
        } catch (e) {
            console.warn('⚠️ Skip Migrating Stand Vouchers:', e.message);
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
