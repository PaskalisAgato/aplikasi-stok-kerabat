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

        console.log("Schema sync completed successfully.");
    } catch (error) {
        console.error("Error syncing schema:", error);
    } finally {
        process.exit();
    }
}

syncSchema();
