import { Client } from 'pg';

const connectionString = 'postgresql://postgres.naklryyhioikogvpcdxd:epizetkano356@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function verify() {
  await client.connect();
  
  const res = await client.query(`
    select 
      count(*) as total_slips, 
      sum(cast(amount as decimal)) as total_sum
    from expenses 
    where expense_date >= '2026-03-01T00:00:00+07:00' 
      and expense_date <= '2026-04-24T23:59:59+07:00'
      and is_deleted = false
  `);
  
  console.log("Database Total with +07:00 boundary:", res.rows[0]);

  const resData19 = await client.query(`
    select id, title, amount, expense_date AT TIME ZONE 'UTC' as utc_date
    from expenses
    where is_deleted = false
      and expense_date >= '2026-04-18T17:00:00Z'
      and expense_date <= '2026-04-19T17:00:00Z'
  `);
  console.log(`There are ${resData19.rowCount} rows strictly on the 19th.`);

  await client.end();
}

verify().catch(console.error);
