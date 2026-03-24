import 'dotenv/config';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { isNotNull, and, sql } from 'drizzle-orm';

/**
 * Enterprise Data Optimization Tool
 * Safely removes redundant base64 image data ONLY IF external storage URL is present
 * This reduces database size (especially egress/bandwidth usage)
 */
async function cleanupBase64Data() {
    console.log('--- Starting Base64 Cleanup (Storage Optimization) ---');
    
    try {
        // 1. Cleanup Inventory Images
        console.log('Optimizing Inventory table...');
        const invResult = await db.update(schema.inventory)
            .set({ imageUrl: null })
            .where(
                and(
                    isNotNull(schema.inventory.externalImageUrl),
                    isNotNull(schema.inventory.imageUrl)
                )
            )
            .returning({ id: schema.inventory.id });
        console.log(`✓ Nullified ${invResult.length} redundant inventory images`);

        // 2. Cleanup Expense Receipts
        console.log('Optimizing Expenses table...');
        const expResult = await db.update(schema.expenses)
            .set({ receiptUrl: null })
            .where(
                and(
                    isNotNull(schema.expenses.externalReceiptUrl),
                    isNotNull(schema.expenses.receiptUrl)
                )
            )
            .returning({ id: schema.expenses.id });
        console.log(`✓ Nullified ${expResult.length} redundant expense receipts`);

        // 3. Cleanup User Profile Images
        console.log('Optimizing User table...');
        const userResult = await db.update(schema.users)
            .set({ image: null })
            .where(
                and(
                    isNotNull(schema.users.externalImage),
                    isNotNull(schema.users.image)
                )
            )
            .returning({ id: schema.users.id });
        console.log(`✓ Nullified ${userResult.length} redundant user profile images`);

        console.log('\n--- Cleanup Successful ---');
        console.log('Note: Database vacuum might be needed to reclaim physical disk space on Supabase.');
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

cleanupBase64Data().then(() => process.exit(0));
