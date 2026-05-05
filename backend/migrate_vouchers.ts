import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log("--- Starting Voucher Table Migration ---");
    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "stand_vouchers" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "code" text NOT NULL UNIQUE,
                "source_transaction_id" integer REFERENCES "sales"("id"),
                "benefit_type" text NOT NULL DEFAULT 'discount',
                "discount_value" decimal(12, 2) DEFAULT '0',
                "status" text NOT NULL DEFAULT 'unused',
                "created_at" timestamp DEFAULT now() NOT NULL,
                "expires_at" timestamp NOT NULL,
                "location_source" integer REFERENCES "outlets"("id"),
                "location_redeemed" integer REFERENCES "outlets"("id"),
                "redeemed_transaction_id" integer,
                "redeemed_at" timestamp
            );

            CREATE INDEX IF NOT EXISTS "voucher_code_idx" ON "stand_vouchers" ("code");
            CREATE INDEX IF NOT EXISTS "voucher_status_idx" ON "stand_vouchers" ("status");
        `);
        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
    }
    process.exit(0);
}

migrate();
