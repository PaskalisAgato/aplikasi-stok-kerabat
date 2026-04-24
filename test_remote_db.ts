import { Client } from 'pg';

const connectionString = 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
});

async function main() {
  await client.connect();
  console.log("Connected to database...");
  
  const ids = [253, 251, 250, 252, 247, 248, 246, 241, 242, 243, 245, 239, 240, 244, 249, 234, 238, 237, 236, 235, 233, 232, 231, 226, 227, 228, 230, 229, 225, 215, 214, 213, 212, 223, 224, 216, 218, 217, 221, 220, 219, 222, 210, 211, 208, 197, 209, 207, 206, 205, 204, 203, 202, 201, 200, 199, 198, 187, 195, 196, 193, 194, 192, 191, 190, 189, 188, 182, 186, 185, 184, 183, 181, 180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 166, 168, 167, 170, 159, 161, 169, 165, 164, 163, 162, 160, 158, 156, 155, 157];
  
  const res = await client.query(`
    select id, title, amount, expense_date, is_deleted, category 
    from expenses 
    where id = ANY($1::int[]) 
    order by id desc
  `, [ids]);
  
  const foundIds = res.rows.map(r => r.id);
  const notFound = ids.filter(i => !foundIds.includes(i));
  const deleted = res.rows.filter(r => r.is_deleted);
  
  console.log(`Requested: ${ids.length}, Found: ${res.rows.length}`);
  console.log(`Not Found IDs: ${notFound.join(", ")}`);
  console.log(`Deleted in DB: ${deleted.length}`);
  if (deleted.length > 0) {
      console.log('Deleted rows:', deleted.map(r => r.id));
  }
  
  console.log('Sample rows (top 5 found):');
  console.table(res.rows.slice(0, 5));

  await client.end();
}

main().catch(console.error);
