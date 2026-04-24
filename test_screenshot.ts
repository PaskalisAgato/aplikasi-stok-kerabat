import { Client } from 'pg';

const connectionString = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function verify() {
  await client.connect();
  
  // Checking exactly what the frontend filters. User filter: 03/01/2026 12:00 AM to 04/24/2026 11:59 PM.
  // We don't know the exact timezone the user means, let's assume WIB (+07:00).
  // So '2026-03-01T00:00:00+07:00' to '2026-04-24T23:59:59+07:00'.
  
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

  // Let's check with UTC boundary (just in case frontend didn't append timezone correctly)
  const resUTC = await client.query(`
    select 
      count(*) as total_slips, 
      sum(cast(amount as decimal)) as total_sum
    from expenses 
    where expense_date >= '2026-03-01T00:00:00Z' 
      and expense_date <= '2026-04-24T23:59:59Z'
      and is_deleted = false
  `);
  
  console.log("Database Total with UTC boundary:", resUTC.rows[0]);

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
