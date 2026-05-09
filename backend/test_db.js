import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const res = await pool.query('select "id", "code", "source_transaction_id", "benefit_type", "discount_value", "status", "created_at", "expires_at", "location_source", "location_redeemed", "redeemed_transaction_id", "redeemed_at" from "stand_vouchers" order by "stand_vouchers"."created_at" desc limit 1');
    console.log(res.rows);
  } catch (err) {
    console.error("DB ERROR: ", err.message);
  }
  pool.end();
}
run();
