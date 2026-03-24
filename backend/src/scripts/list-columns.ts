import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function listColumns() {
    const res = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'inventory'`);
    console.log(JSON.stringify(res.rows, null, 2));
}

listColumns().then(() => process.exit(0));
