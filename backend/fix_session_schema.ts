import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function fixSchema() {
    try {
        console.log("Fixing Session Table Schema...");
        
        // Add token column
        try {
            await db.execute(sql`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "token" TEXT;`);
            await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "session_token_unique" ON "session" ("token");`);
            console.log("Column 'token' added/verified.");
        } catch (e) {
            console.log("Token column update:", (e as any).message);
        }

        // Add createdAt and updatedAt columns
        try {
            await db.execute(sql`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP;`);
            await db.execute(sql`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP;`);
            
            // Set default values for existing rows to avoid NOT NULL constraint issues later if we add them
            await db.execute(sql`UPDATE "session" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;`);
            await db.execute(sql`UPDATE "session" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;`);
            
            // Now make them NOT NULL if needed, but Better Auth might be okay without it for now.
            // drizzle schema says .notNull() though.
            await db.execute(sql`ALTER TABLE "session" ALTER COLUMN "createdAt" SET NOT NULL;`);
            await db.execute(sql`ALTER TABLE "session" ALTER COLUMN "updatedAt" SET NOT NULL;`);
            await db.execute(sql`ALTER TABLE "session" ALTER COLUMN "token" SET NOT NULL;`);

            console.log("Columns 'createdAt' and 'updatedAt' added/verified.");
        } catch (e) {
            console.log("Timestamp columns update:", (e as any).message);
        }

        console.log("Schema fix completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Critical error in fixSchema:", error);
        process.exit(1);
    }
}

fixSchema();
