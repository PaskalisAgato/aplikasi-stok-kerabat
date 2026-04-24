import { Client } from 'pg';

const connectionString = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString });

async function queryDate19() {
  await client.connect();
  
  // Find everything on April 18, 19, 20 WIB time (so UTC from 18th 17:00 to 20th 17:00)
  const res = await client.query(`
    select 
      id, 
      title, 
      amount, 
      expense_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as expense_date_local,
      is_deleted, 
      created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as created_at_local
    from expenses 
    where expense_date >= '2026-04-18T17:00:00.000Z' 
      and expense_date <= '2026-04-19T17:00:00.000Z'
    order by expense_date desc
  `);
  
  console.log(`Found ${res.rowCount} records exactly on 19th April WIB:`);
  console.table(res.rows);

  const searchMissing = await client.query(`
    select id, title, amount, expense_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' as expense_date_local, is_deleted
    from expenses
    where title ilike '%Touge%' or title ilike '%Es batu%' or title ilike '%Bayar server%' or title ilike '%Lengkuas%' or title ilike '%Daun jeruk%'
    order by expense_date desc
    limit 15
  `);
  console.log(`\n\nSearch for the missing items by Name:`);
  console.table(searchMissing.rows);

  await client.end();
}

queryDate19().catch(console.error);
