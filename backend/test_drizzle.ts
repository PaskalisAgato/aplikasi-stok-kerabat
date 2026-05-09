import db from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { desc } from 'drizzle-orm';

async function run() {
  try {
    const sale = await db.select().from(schema.sales).orderBy(desc(schema.sales.id)).limit(3);
    console.log("Latest sales:", sale);
    
    // Check if voucher exists manually:
    const voucher = await db.select().from(schema.standVouchers).orderBy(desc(schema.standVouchers.id)).limit(3);
    console.log("Latest Vouchers:", voucher);
  } catch (err) {
    console.error("DRIZZLE ERROR: ", err);
  }
}
run();
