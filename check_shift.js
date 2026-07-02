import { pool } from './backend/dist/db/index.js';
import 'dotenv/config';

async function checkShifts() {
    try {
        console.log('Querying shift 197...');
        const client = await pool.connect();
        try {
            const targetId = 197;
            
            // Check sales
            const saleRes = await client.query("SELECT id, total_amount, payment_method, status, is_voided, is_deleted, shift_id FROM sales WHERE shift_id = $1 AND status = 'PAID' AND is_voided = false AND is_deleted = false;", [targetId]);
            console.log(`--- SALES FOR SHIFT #${targetId} ---`);
            console.table(saleRes.rows);

            // Check sale items
            const itemRes = await client.query(`
                SELECT si.id, si.recipe_id, r.name, si.quantity, si.subtotal 
                FROM sale_items si 
                JOIN sales s ON si.sale_id = s.id 
                JOIN recipes r ON si.recipe_id = r.id
                WHERE s.shift_id = $1 AND s.status = 'PAID' AND s.is_voided = false AND s.is_deleted = false;
            `, [targetId]);
            console.log(`--- SALE ITEMS FOR SHIFT #${targetId} ---`);
            console.table(itemRes.rows);
        } finally {
            client.release();
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkShifts();
