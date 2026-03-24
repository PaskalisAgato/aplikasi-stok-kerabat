import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function runSafeMigration() {
    console.log('--- Starting Safe Enterprise Migration ---');
    
    const statements = [
        // 1. New Tables
        `CREATE TABLE IF NOT EXISTS "system_logs" (
            "id" serial PRIMARY KEY NOT NULL,
            "method" text NOT NULL,
            "path" text NOT NULL,
            "response_time" integer NOT NULL,
            "payload_size" integer NOT NULL,
            "status_code" integer NOT NULL,
            "user_id" text,
            "error_details" text,
            "created_at" timestamp DEFAULT now() NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS "backups" (
            "id" serial PRIMARY KEY NOT NULL,
            "filename" text NOT NULL,
            "size" integer NOT NULL,
            "status" text NOT NULL,
            "created_at" timestamp DEFAULT now() NOT NULL
        )`,
        
        // 2. Add Columns (Soft Delete, Concurrency, External Storage)
        `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL`,
        `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "version" timestamp DEFAULT now() NOT NULL`,
        `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "external_image_url" text`,
        `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL`,

        `ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "user_id" text`,
        `ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "external_receipt_url" text`,
        `ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL`,

        `ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL`,

        `ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "external_image_url" text`,
        `ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL`,

        `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "external_image_url" text`,

        // 3. Performance Indexes
        `CREATE INDEX IF NOT EXISTS "logs_path_idx" ON "system_logs" ("path")`,
        `CREATE INDEX IF NOT EXISTS "logs_created_at_idx" ON "system_logs" ("created_at")`
    ];

    for (const statement of statements) {
        try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await db.execute(sql.raw(statement));
        } catch (error: any) {
            console.warn(`[Migration Warning] ${error.message}`);
        }
    }

    console.log('--- Safe Migration Completed ---');
    process.exit(0);
}

runSafeMigration();
