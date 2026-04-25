import { db } from './src/config/db.js';
import { sql } from 'drizzle-orm';

async function syncSchema() {
    try {
        console.log("Starting manual schema sync...");
        
        // 1. Add columns to attendance
        await db.execute(sql`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "check_in_timestamp" text;`);
        await db.execute(sql`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "check_out_timestamp" text;`);
        await db.execute(sql`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "location" text;`);
        await db.execute(sql`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 7);`);
        await db.execute(sql`ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 7);`);
        console.log("[Attendance] Columns added (if not exists).");

        // 2. Create shift_settings
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "shift_settings" (
                "id" serial PRIMARY KEY NOT NULL,
                "code" text NOT NULL,
                "start_time" text NOT NULL,
                "end_time" text NOT NULL,
                "is_active" boolean DEFAULT true NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "shift_settings_code_unique" UNIQUE("code")
            );
        `);
        console.log("[ShiftSettings] Table created (if not exists).");

        // 3. Create shift_requests
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "shift_requests" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL REFERENCES "user"("id"),
                "date" timestamp NOT NULL,
                "requested_shift" text NOT NULL,
                "reason" text,
                "status" text DEFAULT 'pending' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log("[ShiftRequests] Table created (if not exists).");

        // 4. Create payroll
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "payroll" (
                "id" serial PRIMARY KEY NOT NULL,
                "user_id" text NOT NULL REFERENCES "user"("id"),
                "period_start" timestamp NOT NULL,
                "period_end" timestamp NOT NULL,
                "total_work_days" integer DEFAULT 0 NOT NULL,
                "total_hours" numeric(10, 2) DEFAULT '0' NOT NULL,
                "base_salary" numeric(12, 2) NOT NULL,
                "overtime_pay" numeric(12, 2) DEFAULT '0' NOT NULL,
                "deductions" numeric(12, 2) DEFAULT '0' NOT NULL,
                "total_net_salary" numeric(12, 2) NOT NULL,
                "status" text DEFAULT 'draft' NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log("[Payroll] Table created (if not exists).");

        // 5. Create owner_income
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "owner_income" (
                "id" serial PRIMARY KEY NOT NULL,
                "title" text NOT NULL,
                "amount" numeric(12, 2) NOT NULL,
                "source" text DEFAULT 'OWNER' NOT NULL,
                "user_id" text REFERENCES "user"("id"),
                "income_date" timestamp DEFAULT now() NOT NULL,
                "notes" text,
                "is_deleted" boolean DEFAULT false NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL
            );
        `);
        console.log("[OwnerIncome] Table created (if not exists).");

        // 6. Maintenance: Add missing columns to existing tables
        console.log("Updating existing tables with new columns...");
        
        // Shifts
        await db.execute(sql`ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "ledger_snapshot" text;`);
        
        // Sales
        await db.execute(sql`ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "order_source" text DEFAULT 'DIRECT' NOT NULL;`);
        
        // Expenses
        await db.execute(sql`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "vendor" text;`);
        await db.execute(sql`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "fund_source" text DEFAULT 'CASHIER' NOT NULL;`);
        await db.execute(sql`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'CASH' NOT NULL;`);
        
        // Discounts
        await db.execute(sql`ALTER TABLE "discounts" ADD COLUMN IF NOT EXISTS "min_purchase" numeric(12, 2) DEFAULT '0' NOT NULL;`);

        // 7. Add Indices
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "owner_income_date_idx" ON "owner_income" ("income_date");`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "owner_income_is_deleted_idx" ON "owner_income" ("is_deleted");`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "expenses_fund_source_idx" ON "expenses" ("fund_source");`);

        console.log("Schema sync completed successfully.");
    } catch (error) {
        console.error("Error syncing schema:", error);
    } finally {
        process.exit();
    }
}

syncSchema();
