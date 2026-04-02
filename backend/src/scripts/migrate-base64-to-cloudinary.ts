/**
 * Migration Script: Convert all base64 image data in the database to Cloudinary URLs.
 * 
 * This script scans all image columns across all tables and:
 * 1. Detects base64-encoded images (starting with "data:image")
 * 2. Uploads them to Cloudinary
 * 3. Updates the database record with the Cloudinary URL
 * 
 * Usage: npx tsx backend/src/scripts/migrate-base64-to-cloudinary.ts
 */

import 'dotenv/config';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, like, sql } from 'drizzle-orm';
import { uploadToCloudinary } from '../utils/cloudinary.js';

interface MigrationTarget {
    tableName: string;
    table: any;
    idField: any;
    imageField: any;
    imageFieldName: string;
    cloudinaryFolder: string;
}

const targets: MigrationTarget[] = [
    {
        tableName: 'inventory',
        table: schema.inventory,
        idField: schema.inventory.id,
        imageField: schema.inventory.imageUrl,
        imageFieldName: 'imageUrl',
        cloudinaryFolder: 'products',
    },
    {
        tableName: 'expenses',
        table: schema.expenses,
        idField: schema.expenses.id,
        imageField: schema.expenses.receiptUrl,
        imageFieldName: 'receiptUrl',
        cloudinaryFolder: 'expenses',
    },
    {
        tableName: 'attendance (checkIn)',
        table: schema.attendance,
        idField: schema.attendance.id,
        imageField: schema.attendance.checkInPhoto,
        imageFieldName: 'checkInPhoto',
        cloudinaryFolder: 'attendance',
    },
    {
        tableName: 'attendance (checkOut)',
        table: schema.attendance,
        idField: schema.attendance.id,
        imageField: schema.attendance.checkOutPhoto,
        imageFieldName: 'checkOutPhoto',
        cloudinaryFolder: 'attendance',
    },
    {
        tableName: 'todos',
        table: schema.todos,
        idField: schema.todos.id,
        imageField: schema.todos.photoProof,
        imageFieldName: 'photoProof',
        cloudinaryFolder: 'todos',
    },
    {
        tableName: 'todoCompletions',
        table: schema.todoCompletions,
        idField: schema.todoCompletions.id,
        imageField: schema.todoCompletions.photoProof,
        imageFieldName: 'photoProof',
        cloudinaryFolder: 'todos',
    },
];

async function migrateTable(target: MigrationTarget) {
    console.log(`\n📦 Scanning: ${target.tableName}.${target.imageFieldName}...`);

    // Find all records where the image field starts with 'data:image'
    const records = await db
        .select({
            id: target.idField,
            imageData: target.imageField,
        })
        .from(target.table)
        .where(like(target.imageField, 'data:image%'));

    console.log(`   Found ${records.length} base64 records to migrate`);

    let success = 0;
    let failed = 0;

    for (const record of records) {
        try {
            const base64String = record.imageData as string;
            if (!base64String || !base64String.startsWith('data:image')) {
                continue;
            }

            console.log(`   ⬆️  Uploading record ID ${record.id} (${(base64String.length / 1024).toFixed(1)}KB)...`);

            const cloudinaryUrl = await uploadToCloudinary(base64String, target.cloudinaryFolder);

            if (cloudinaryUrl) {
                // Update the record with the Cloudinary URL
                await db
                    .update(target.table)
                    .set({ [target.imageFieldName]: cloudinaryUrl })
                    .where(eq(target.idField, record.id));

                console.log(`   ✅ ID ${record.id} → ${cloudinaryUrl}`);
                success++;
            } else {
                console.log(`   ⚠️  ID ${record.id}: Upload returned null, skipping`);
                failed++;
            }
        } catch (error: any) {
            console.error(`   ❌ ID ${record.id}: ${error.message}`);
            failed++;
        }
    }

    console.log(`   📊 Results: ${success} migrated, ${failed} failed, ${records.length} total`);
    return { success, failed, total: records.length };
}

async function main() {
    console.log('🚀 Starting Base64 → Cloudinary Migration');
    console.log('==========================================');
    console.log(`Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`API Key: ${process.env.CLOUDINARY_API_KEY ? '***configured***' : '❌ MISSING'}`);

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        console.error('\n❌ CLOUDINARY credentials not configured! Aborting.');
        process.exit(1);
    }

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalRecords = 0;

    for (const target of targets) {
        const result = await migrateTable(target);
        totalSuccess += result.success;
        totalFailed += result.failed;
        totalRecords += result.total;
    }

    console.log('\n==========================================');
    console.log('📊 MIGRATION COMPLETE');
    console.log(`   Total Records: ${totalRecords}`);
    console.log(`   Migrated:      ${totalSuccess}`);
    console.log(`   Failed:        ${totalFailed}`);
    console.log('==========================================');

    process.exit(0);
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
