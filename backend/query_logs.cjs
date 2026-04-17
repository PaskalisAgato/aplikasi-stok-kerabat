const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.lvfqfynqzgxjbkotlccp:epizetkano356@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM system_logs ORDER BY id DESC LIMIT 5");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
