const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.naklryyhioikogvpcdxd:epizetkano356@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Adding discount_price to inventory...');
    await client.query(`
      ALTER TABLE inventory 
      ADD COLUMN IF NOT EXISTS discount_price DECIMAL(12,2) NOT NULL DEFAULT 0;
    `);
    console.log('✅ Column discount_price added successfully!');
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
