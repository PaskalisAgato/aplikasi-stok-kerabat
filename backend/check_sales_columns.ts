import pg from 'pg';

const pool = new pg.Pool({
    connectionString: "postgresql://kerabatuser:pos789Secure!@localhost:5432/kerabatpos"
});

async function run() {
    const client = await pool.connect();
    try {
        // 1. Check what columns actually exist in the  `sales` table
        const res = await client.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'sales'
            ORDER BY ordinal_position;
        `);
        console.log("=== KOLOM YANG ADA DI TABEL sales ===");
        console.table(res.rows.map(r => ({ kolom: r.column_name, tipe: r.data_type })));

        // 2. Columns the ORM expects but might be missing
        const expected = [
            'id','shift_id','user_id','sub_total','tax_amount','service_charge_amount',
            'total_amount','payment_method','payment_status','status','customer_info',
            'discount_amount','discount_type','is_voided','void_reason','voided_by',
            'voided_at','is_deleted','offline_id','payment_reference_id','member_id',
            'discount_id','discount_ids','discount_total','points_used','points_earned',
            'order_source','created_at'
        ];
        const actual = res.rows.map((r: any) => r.column_name);
        const missing = expected.filter(c => !actual.includes(c));
        if (missing.length > 0) {
            console.log("\n❌ KOLOM YANG KURANG:", missing);
        } else {
            console.log("\n✅ Semua kolom sudah ada!");
        }
    } finally {
        client.release();
        pool.end();
    }
}
run().catch(console.error);
