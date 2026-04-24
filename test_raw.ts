import { Client } from 'pg';

const connectionString = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function verify() {
  await client.connect();
  const res = await client.query(`
    select id, title, expense_date, expense_date::text as raw_date 
    from expenses 
    where id IN (243, 242, 241, 240, 239)
  `);
  console.table(res.rows);
  await client.end();
}
verify().catch(console.error);
