import { Client } from 'pg';

const connectionString = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString });

async function restore() {
  await client.connect();
  console.log("Connected to database. Restoring deleted IDs...");
  
  const res = await client.query(
    'UPDATE expenses SET is_deleted = false WHERE id IN (227, 193, 157) RETURNING id, title, amount, is_deleted'
  );
  
  console.table(res.rows);
  console.log(`Successfully restored ${res.rowCount} records.`);
  await client.end();
}

restore().catch(console.error);
