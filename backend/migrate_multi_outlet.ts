import 'dotenv/config';
import { pool } from './src/config/db.js';

async function migrate() {
    console.log('--- Connecting to DB ---');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Phase 1: Create Tenants and Outlets Tables ---');
        await client.query(`
            CREATE TABLE IF NOT EXISTS "tenants" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" text NOT NULL,
                "owner_id" text NOT NULL,
                "subscription_status" text DEFAULT 'active' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS "outlets" (
                "id" serial PRIMARY KEY,
                "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
                "name" text NOT NULL,
                "address" text,
                "timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);

        console.log('--- Phase 2: Seed Initial Tenant and Outlet ---');
        const { rows: users } = await client.query('SELECT id FROM "user" WHERE role = $1 LIMIT 1', ['Admin']);
        if (users.length === 0) throw new Error("No Admin user found for tenant ownership");
        const adminId = users[0].id;

        const { rows: tenantCheck } = await client.query("SELECT id FROM tenants LIMIT 1");
        let tenantId;
        if (tenantCheck.length === 0) {
            const { rows: tenantRows } = await client.query(
                "INSERT INTO tenants (name, owner_id) VALUES ('Kerabat Primary', $1) RETURNING id",
                [adminId]
            );
            tenantId = tenantRows[0].id;
        } else {
            tenantId = tenantCheck[0].id;
        }

        await client.query(
            "INSERT INTO outlets (id, tenant_id, name, address) VALUES (1, $1, 'Kerabat Pusat', 'Main Branch') ON CONFLICT (id) DO NOTHING",
            [tenantId]
        );

        console.log('--- Phase 3: Add outlet_id to Core Tables ---');
        const tables = [
            'inventory', 'recipes', 'shifts', 'sales', 
            'expenses', 'attendance', 'work_shifts', 'owner_income', 'audit_logs'
        ];

        for (const table of tables) {
            console.log(`Updating table: ${table}`);
            const { rows: colCheck } = await client.query(
                "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = 'outlet_id'",
                [table]
            );

            if (colCheck.length === 0) {
                await client.query(`ALTER TABLE "${table}" ADD COLUMN "outlet_id" integer`);
                await client.query(`UPDATE "${table}" SET "outlet_id" = 1 WHERE "outlet_id" IS NULL`);
                
                if (table !== 'audit_logs') {
                    await client.query(`ALTER TABLE "${table}" ALTER COLUMN "outlet_id" SET NOT NULL`);
                    await client.query(`ALTER TABLE "${table}" ALTER COLUMN "outlet_id" SET DEFAULT 1`);
                }
                
                await client.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${table}_outlet_id_fkey" FOREIGN KEY ("outlet_id") REFERENCES "outlets"("id")`);
            }
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
