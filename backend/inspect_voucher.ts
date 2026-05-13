import { Client } from 'pg';

async function run() {
    const voucherCode = 'KKT-DSL5ZW-31';
    console.log(`--- Inspecting Voucher "${voucherCode}" on VPS ---`);

    const client = new Client({
        connectionString: "postgresql://kerabatuser:pos789Secure!@38.47.180.235:5432/kerabatpos"
    });

    try {
        await client.connect();
        
        // 1. Find the voucher in promo_vouchers to get batch relation
        console.log('\n--- 1. Promo Voucher Data ---');
        const promoRes = await client.query(`
            SELECT v.code, v.batch_id, b.promo_name, b.menu_name, b.normal_price, b.voucher_price
            FROM promo_vouchers v
            JOIN promo_voucher_batches b ON v.batch_id = b.id
            WHERE v.code = $1
        `, [voucherCode]);

        if (promoRes.rows.length === 0) {
            console.log('❌ Voucher not found in promo_vouchers.');
        } else {
            console.log(promoRes.rows[0]);
            const promoName = promoRes.rows[0].promo_name;
            const menuName = promoRes.rows[0].menu_name;
            
            // 2. Find the associated discount rule
            console.log('\n--- 2. Associated Discount Rules ---');
            const ruleRes = await client.query(`
                SELECT id, name, type, conditions FROM discount_rules 
                WHERE name = $1
            `, [promoName]);
            console.log(ruleRes.rows);

            // 3. Search for the menu name in recipes
            console.log(`\n--- 3. Matching Products for "${menuName}" ---`);
            const productRes = await client.query(`
                SELECT id, name, price, category FROM recipes 
                WHERE name ILIKE $1
            `, [`%${menuName}%`]);
            console.log(productRes.rows);
        }

    } catch (e) {
        console.error('Inspection failed:', e);
    } finally {
        await client.end();
    }
    process.exit(0);
}

run();
