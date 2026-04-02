import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { requireAdmin } from '../middleware/auth.js';

export const migrationRouter = Router();

/**
 * One-time migration: scan all image fields in the database and upload
 * any remaining Base64 strings to Cloudinary, replacing them with URLs.
 */
migrationRouter.post('/migrate-to-cloudinary', requireAdmin, async (req: Request, res: Response) => {
    const results: { table: string; field: string; id: number | string; status: string }[] = [];
    let totalMigrated = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    try {
        // 1. Inventory — imageUrl
        const inventoryItems = await db.select({
            id: schema.inventory.id,
            imageUrl: schema.inventory.imageUrl
        }).from(schema.inventory);

        for (const item of inventoryItems) {
            if (item.imageUrl && item.imageUrl.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.imageUrl, 'products');
                if (url) {
                    await db.update(schema.inventory).set({ imageUrl: url }).where(eq(schema.inventory.id, item.id));
                    results.push({ table: 'inventory', field: 'imageUrl', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'inventory', field: 'imageUrl', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }
        }

        // 2. Recipes — imageUrl
        const recipeItems = await db.select({
            id: schema.recipes.id,
            imageUrl: schema.recipes.imageUrl
        }).from(schema.recipes);

        for (const item of recipeItems) {
            if (item.imageUrl && item.imageUrl.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.imageUrl, 'products');
                if (url) {
                    await db.update(schema.recipes).set({ imageUrl: url }).where(eq(schema.recipes.id, item.id));
                    results.push({ table: 'recipes', field: 'imageUrl', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'recipes', field: 'imageUrl', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }
        }

        // 3. Expenses — receiptUrl
        const expenseItems = await db.select({
            id: schema.expenses.id,
            receiptUrl: schema.expenses.receiptUrl
        }).from(schema.expenses);

        for (const item of expenseItems) {
            if (item.receiptUrl && item.receiptUrl.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.receiptUrl, 'expenses');
                if (url) {
                    await db.update(schema.expenses).set({ receiptUrl: url }).where(eq(schema.expenses.id, item.id));
                    results.push({ table: 'expenses', field: 'receiptUrl', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'expenses', field: 'receiptUrl', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }
        }

        // 4. Attendance — checkInPhoto, checkOutPhoto
        const attendanceItems = await db.select({
            id: schema.attendance.id,
            checkInPhoto: schema.attendance.checkInPhoto,
            checkOutPhoto: schema.attendance.checkOutPhoto
        }).from(schema.attendance);

        for (const item of attendanceItems) {
            // Check-in photo
            if (item.checkInPhoto && item.checkInPhoto.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.checkInPhoto, 'attendance');
                if (url) {
                    await db.update(schema.attendance).set({ checkInPhoto: url }).where(eq(schema.attendance.id, item.id));
                    results.push({ table: 'attendance', field: 'checkInPhoto', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'attendance', field: 'checkInPhoto', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }

            // Check-out photo
            if (item.checkOutPhoto && item.checkOutPhoto.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.checkOutPhoto, 'attendance');
                if (url) {
                    await db.update(schema.attendance).set({ checkOutPhoto: url }).where(eq(schema.attendance.id, item.id));
                    results.push({ table: 'attendance', field: 'checkOutPhoto', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'attendance', field: 'checkOutPhoto', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }
        }

        // 5. Todos — photoProof
        const todoItems = await db.select({
            id: schema.todos.id,
            photoProof: schema.todos.photoProof
        }).from(schema.todos);

        for (const item of todoItems) {
            if (item.photoProof && item.photoProof.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.photoProof, 'todos');
                if (url) {
                    await db.update(schema.todos).set({ photoProof: url }).where(eq(schema.todos.id, item.id));
                    results.push({ table: 'todos', field: 'photoProof', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'todos', field: 'photoProof', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }
        }

        // 6. Todo Completions — photoProof
        const completionItems = await db.select({
            id: schema.todoCompletions.id,
            photoProof: schema.todoCompletions.photoProof
        }).from(schema.todoCompletions);

        for (const item of completionItems) {
            if (item.photoProof && item.photoProof.startsWith('data:image')) {
                const url = await uploadToCloudinary(item.photoProof, 'todos');
                if (url) {
                    await db.update(schema.todoCompletions).set({ photoProof: url }).where(eq(schema.todoCompletions.id, item.id));
                    results.push({ table: 'todoCompletions', field: 'photoProof', id: item.id, status: 'migrated' });
                    totalMigrated++;
                } else {
                    results.push({ table: 'todoCompletions', field: 'photoProof', id: item.id, status: 'failed' });
                    totalFailed++;
                }
            } else {
                totalSkipped++;
            }
        }

        res.json({
            success: true,
            message: `Migration complete. Migrated: ${totalMigrated}, Failed: ${totalFailed}, Skipped (already URL or empty): ${totalSkipped}`,
            data: { totalMigrated, totalFailed, totalSkipped, details: results }
        });

    } catch (error: any) {
        console.error('[Migration] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Migration error: ' + error.message,
            data: { totalMigrated, totalFailed, totalSkipped, details: results }
        });
    }
});
