import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { desc, eq, gte, inArray, sql, and } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBase64Image } from '../middleware/validateImage.js';
import ExcelJS from 'exceljs';
import { CashierShiftService } from '../services/cashierShift.service.js';
import { IdempotencyService } from '../services/idempotency.service.js';

export const financeRouter = Router();

// GET all expenses with pagination
financeRouter.get('/expenses', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // Get real total count (separate query) for correct pagination
        // PostgreSQL returns count as string, so we use sql<string> and parseInt
        const [countResult] = await db.select({
            count: sql<string>`count(*)`
        })
        .from(schema.expenses)
        .where(eq(schema.expenses.isDeleted, false));
        
        const totalCount = parseInt(countResult?.count || '0', 10);

        const _expenses = await db.select({
            id: schema.expenses.id,
            title: schema.expenses.title,
            vendor: schema.expenses.vendor,
            category: schema.expenses.category,
            amount: schema.expenses.amount,
            userId: schema.expenses.userId,
            expenseDate: schema.expenses.expenseDate,
            createdAt: schema.expenses.createdAt,
            receiptUrl: schema.expenses.receiptUrl,
            hasReceipt: sql`CASE WHEN ${schema.expenses.receiptUrl} IS NOT NULL THEN true ELSE false END`,
            externalReceiptUrl: schema.expenses.externalReceiptUrl,
            fundSource: schema.expenses.fundSource
        })
        .from(schema.expenses)
        .where(eq(schema.expenses.isDeleted, false))
        .orderBy(desc(schema.expenses.expenseDate))
        .limit(limit)
        .offset(offset);
        
        res.json({ 
            success: true, 
            data: _expenses,
            meta: {
                total: totalCount,
                limit,
                offset,
                page: Math.floor(offset / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pengeluaran' });
    }
});

// GET expense photo
financeRouter.get('/expenses/:id/photo', requireAuth, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const [expense] = await db.select({
            receiptUrl: schema.expenses.receiptUrl
        })
        .from(schema.expenses)
        .where(eq(schema.expenses.id, id))
        .limit(1);

        if (!expense || !expense.receiptUrl) {
            return res.status(404).json({ success: false, message: 'Foto bukti tidak ditemukan' });
        }

        res.json({ success: true, data: expense.receiptUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil foto bukti' });
    }
});

// GET all expense categories
financeRouter.get('/expenses/categories', requireAuth, async (req: Request, res: Response) => {
    try {
        const cats = await db.select({
            id: schema.expenseCategories.id,
            name: schema.expenseCategories.name,
            icon: schema.expenseCategories.icon
        }).from(schema.expenseCategories).orderBy(schema.expenseCategories.name);
        
        console.log(`[FinanceAPI] Fetched ${cats.length} expense categories`);
        res.json({ 
            success: true, 
            data: cats,
            meta: { total: cats.length, limit: cats.length, page: 1 }
        });
    } catch (error) {
        console.error('[FinanceAPI] Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil kategori pengeluaran' });
    }
});

// POST new expense category
financeRouter.post('/expenses/categories', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, icon } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Nama kategori diperlukan' });

        const categoryName = name.trim();
        
        // CASE-INSENSITIVE DUPLICATE CHECK
        const [existing] = await db.select()
            .from(schema.expenseCategories)
            .where(sql`lower(${schema.expenseCategories.name}) = lower(${categoryName})`)
            .limit(1);
        
        if (existing) {
            console.warn(`[FinanceAPI] Duplicate category attempt: ${categoryName}`);
            return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
        }

        const [newCat] = await db.insert(schema.expenseCategories).values({
            name: categoryName,
            icon: icon || 'category'
        }).returning({
            id: schema.expenseCategories.id,
            name: schema.expenseCategories.name,
            icon: schema.expenseCategories.icon
        });

        console.log(`[FinanceAPI] Category created: ${newCat.name} (ID: ${newCat.id})`);
        res.status(201).json({ success: true, data: newCat });
    } catch (error: any) {
        console.error('[FinanceAPI] Error adding category:', error);
        // Handle unique constraint violation just in case of race condition
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
        }
        res.status(500).json({ success: false, message: 'Gagal menambah kategori pengeluaran' });
    }
});

// GET Export Expenses Excel
financeRouter.get('/expenses/export', async (req: Request, res: Response) => {
    try {
        const allExpenses = await db.select({
            id: schema.expenses.id,
            title: schema.expenses.title,
            vendor: schema.expenses.vendor,
            category: schema.expenses.category,
            amount: schema.expenses.amount,
            expenseDate: schema.expenses.expenseDate,
            externalReceiptUrl: schema.expenses.externalReceiptUrl
        }).from(schema.expenses).orderBy(desc(schema.expenses.expenseDate));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Kerabat POS';
        workbook.lastModifiedBy = 'Kerabat POS';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Data Pengeluaran');
        sheet.columns = [
            { header: 'ID', key: 'id', width: 5 },
            { header: 'Catatan/Judul', key: 'title', width: 30 },
            { header: 'Vendor/Supplier', key: 'vendor', width: 25 },
            { header: 'Kategori', key: 'category', width: 20 },
            { header: 'Jumlah', key: 'amount', width: 15 },
            { header: 'Tanggal', key: 'date', width: 20 },
            { header: 'Bukti', key: 'receipt', width: 40 },
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        allExpenses.forEach(exp => {
            sheet.addRow({
                id: exp.id,
                title: exp.title,
                vendor: (exp as any).vendor || '-',
                category: exp.category,
                amount: parseFloat(exp.amount),
                date: exp.expenseDate.toLocaleString('id-ID'),
                receipt: exp.externalReceiptUrl || '-'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Pengeluaran_Kerabat_POS.xlsx');

        await workbook.xlsx.write(res);
    } catch (error: any) {
        console.error('Export expenses error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Gagal mengekspor data pengeluaran' });
        }
    }
});

// GET Single Expense Detail (Full Details including receipt image)
financeRouter.get('/expenses/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

        const [expense] = await db.select({
            id: schema.expenses.id,
            title: schema.expenses.title,
            vendor: schema.expenses.vendor,
            category: schema.expenses.category,
            amount: schema.expenses.amount,
            receiptUrl: schema.expenses.receiptUrl,
            externalReceiptUrl: schema.expenses.externalReceiptUrl,
            expenseDate: schema.expenses.expenseDate,
            fundSource: schema.expenses.fundSource,
            userId: schema.expenses.userId,
            createdAt: schema.expenses.createdAt
        }).from(schema.expenses).where(
            and(
                eq(schema.expenses.id, id),
                eq(schema.expenses.isDeleted, false)
            )
        ).limit(1);
        if (!expense) return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });

        res.json({ success: true, data: expense });
    } catch (error) {
        console.error('Error fetching expense details:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail pengeluaran' });
    }
});

// DELETE expense category
financeRouter.delete('/expenses/categories/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID tidak valid' });

        const [deleted] = await db.delete(schema.expenseCategories)
            .where(eq(schema.expenseCategories.id, id))
            .returning();

        if (!deleted) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
        res.json({ success: true, message: 'Kategori berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
    }
});

import { CashLedgerService } from '../services/cashLedger.service.js';

// POST new expense
financeRouter.post('/expenses', requireAuth, validateBase64Image('receiptUrl'), async (req: Request, res: Response) => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    try {
        // 1. HARDENING: Server-side Idempotency Cache
        const cached = await IdempotencyService.getCachedResponse(idempotencyKey);
        if (cached) return res.status(cached.statusCode).json(cached.body);

        const { title, vendor, category, amount, date, receiptUrl, fundSource = 'CASHIER' } = req.body;
        
        if (!title || !category || amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ success: false, message: 'Data pengeluaran tidak lengkap atau nominal tidak valid' });
        }

        // 2. HARDENING: Active Shift Guard (MANDATORY)
        const userId = (req as any).user?.id;
        const activeShift = userId ? await CashierShiftService.getActiveShift(userId) : null;
        
        if (!activeShift) {
            return res.status(403).json({ success: false, message: 'KEAMANAN: Tidak bisa mencatat pengeluaran tanpa shift aktif. Silakan buka shift terlebih dahulu.' });
        }

        let expenseDate = new Date();
        if (date) {
            expenseDate = new Date(date);
            if (isNaN(expenseDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Format tanggal tidak valid' });
            }
        }

        const [newExpense] = await db.insert(schema.expenses).values({
            title,
            vendor,
            category,
            amount: amount.toString(),
            receiptUrl: receiptUrl || null,
            expenseDate: expenseDate,
            userId: userId || null,
            shiftId: activeShift.id,
            fundSource: fundSource
        }).returning({
            id: schema.expenses.id,
            amount: schema.expenses.amount,
            title: schema.expenses.title,
            fundSource: schema.expenses.fundSource
        });

        // ONLY add to Cash Ledger if it uses Cashier's money (drawer)
        if (fundSource === 'CASHIER') {
            await CashLedgerService.addEntry({
                shiftId: activeShift.id,
                type: 'expense',
                amount: amount,
                referenceId: newExpense.id,
                description: `Pengeluaran (KASIR): ${newExpense.title}`
            });
        }

        const responseBody = { success: true, data: newExpense };

        // 3. Save for idempotency
        await IdempotencyService.setCachedResponse(idempotencyKey, responseBody, 201);

        console.log(`[FinanceAPI-Hardened] Expense recorded: "${title}" | Shift: ${activeShift.id}`);
        res.status(201).json(responseBody);
    } catch (error) {
        console.error('[FinanceAPI] Error adding expense:', error);
        res.status(500).json({ success: false, message: 'Gagal merekam pengeluaran' });
    }
});

// REVERSE (DELETE) expense (Anti-Fraud: No actual deletion, only ledger reversal)
financeRouter.delete('/expenses/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'ID pengeluaran tidak valid' });
        }

        const expenseArr = await db.select().from(schema.expenses).where(eq(schema.expenses.id, id)).limit(1);
        if (expenseArr.length === 0) {
            return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });
        }
        
        const expenseToReverse = expenseArr[0];
        if (expenseToReverse.isDeleted) {
            return res.status(400).json({ success: false, message: 'Pengeluaran ini sudah di-reverse sebelumnya' });
        }

        // 1. Soft delete so it hides from UI
        await db.update(schema.expenses).set({ isDeleted: true }).where(eq(schema.expenses.id, id));

        // 2. Reverse Ledger (insert negative expense)
        if (expenseToReverse.shiftId) {
            await CashLedgerService.addEntry({
                shiftId: expenseToReverse.shiftId,
                type: 'expense', // Keeping type identical but value negative neutralizes the sum
                amount: -parseFloat(expenseToReverse.amount),
                referenceId: expenseToReverse.id,
                description: `Reverse Pengeluaran: ${expenseToReverse.title}`
            });
        }

        // 3. Audit Log
        await db.insert(schema.auditLogs).values({
            userId: (req as any).user?.id,
            action: 'REVERSE_EXPENSE',
            tableName: 'expenses',
            oldData: JSON.stringify(expenseToReverse),
            newData: JSON.stringify({ isDeleted: true, status: 'REVERSED' }),
            createdAt: new Date()
        });

        res.json({ success: true, message: 'Pengeluaran berhasil di-reverse sesuai kebijakan keamanan.' });
    } catch (error) {
        console.error('Error reversing expense:', error);
        res.status(500).json({ success: false, message: 'Gagal me-reverse pengeluaran' });
    }
});

// UPDATE expense (Anti-Fraud: Modification is disabled!)
financeRouter.put('/expenses/:id', requireAuth, async (req: Request, res: Response) => {
    return res.status(403).json({ success: false, message: 'Keamanan Lanjutan Aktif: Pengeluaran tidak bisa diedit. Silakan hapus/reverse lalu buat data baru.' });
});

// Legacy update function disabled
// financeRouter.put('/expenses/:id', requireAuth, validateBase64Image('receiptUrl'), async (req: Request, res: Response) => {

// GET Dashboard & P&L Report Summary
financeRouter.get('/reports', requireAdmin, async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Optimized Revenue Calculation (Native SQL SUM)
        const revenueResult = await db.select({ 
            total: sql<number>`COALESCE(SUM(${schema.sales.totalAmount}), 0)` 
        })
        .from(schema.sales)
        .where(eq(schema.sales.isDeleted, false));
        
        const revenue = Number(revenueResult[0].total);
        
        // 2. Optimized Today's Revenue (Native SQL SUM)
        const todayRevenueResult = await db.select({ 
            total: sql<number>`COALESCE(SUM(${schema.sales.totalAmount}), 0)` 
        })
        .from(schema.sales)
        .where(
            and(
                gte(schema.sales.createdAt, today),
                eq(schema.sales.isDeleted, false)
            )
        );
        const revenueToday = Number(todayRevenueResult[0].total);

        // 3. Optimized Total Expenses (Native SQL SUM)
        const expenseResult = await db.select({ 
            total: sql<number>`COALESCE(SUM(${schema.expenses.amount}), 0)` 
        })
        .from(schema.expenses)
        .where(eq(schema.expenses.isDeleted, false));
        
        const totalExpenses = Number(expenseResult[0].total);

        // 4. Get Top 5 Menus (Recipe Sales Volume)
        const topMenusRaw = await db.select({
            recipeId: schema.saleItems.recipeId,
            name: schema.recipes.name,
            totalQty: sql<number>`sum(${schema.saleItems.quantity})`
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .groupBy(schema.saleItems.recipeId, schema.recipes.name)
        .orderBy(sql`sum(${schema.saleItems.quantity}) DESC`)
        .limit(5);

        res.json({
            success: true,
            data: {
                revenue,
                revenueToday,
                expenses: totalExpenses,
                netProfit: revenue - totalExpenses,
                topMenus: topMenusRaw
            }
        });

    } catch (error) {
        console.error('Error computing finance reports:', error);
        res.status(500).json({ success: false, message: 'Gagal menghitung laporan keuangan' });
    }
});

// GET HPP (COGS) Analysis
financeRouter.get('/hpp', requireAdmin, async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Get all sale items in last 30 days
        const salesInPeriod = await db.select({
            id: schema.sales.id,
            createdAt: schema.sales.createdAt
        })
        .from(schema.sales)
        .where(
            and(
                gte(schema.sales.createdAt, thirtyDaysAgo),
                eq(schema.sales.isDeleted, false)
            )
        );

        const saleIds = salesInPeriod.map((s: { id: number }) => s.id);
        if (saleIds.length === 0) {
            return res.json({ success: true, data: { totalHPP: 0, ingredientsHPP: [], recipeHPP: [] } });
        }

        const items = await db.select({
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity
        })
            .from(schema.saleItems)
            .where(inArray(schema.saleItems.saleId, saleIds));

        // 2. Fetch BOM for all affected recipes
        const recipeIds: number[] = [...new Set(items.map((i: any) => i.recipeId as number))] as number[];
        
        let boms: any[] = [];
        if (recipeIds.length > 0) {
            boms = await db.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                usageQty: schema.recipeIngredients.quantity,
                ingredientName: schema.inventory.name,
                pricePerUnit: schema.inventory.pricePerUnit
            })
            .from(schema.recipeIngredients)
            .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
            .where(inArray(schema.recipeIngredients.recipeId, recipeIds));
        }

        // 3. Optimized HPP Calculation (Single Query Aggregate)
        const hppResult = await db.select({
            totalHPP: sql<number>`COALESCE(SUM(${schema.saleItems.quantity} * ${schema.recipeIngredients.quantity} * ${schema.inventory.pricePerUnit}), 0)`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .innerJoin(schema.recipeIngredients, eq(schema.saleItems.recipeId, schema.recipeIngredients.recipeId))
        .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
        .where(
            and(
                gte(schema.sales.createdAt, thirtyDaysAgo),
                eq(schema.sales.isDeleted, false)
            )
        );

        const totalHPP = Number(hppResult[0].totalHPP);

        // 4. Ingredient-wise Attribution (Top Offenders)
        const ingredientsHPP = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            totalCost: sql<number>`SUM(${schema.saleItems.quantity} * ${schema.recipeIngredients.quantity} * ${schema.inventory.pricePerUnit})`,
            totalQty: sql<number>`SUM(${schema.saleItems.quantity} * ${schema.recipeIngredients.quantity})`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .innerJoin(schema.recipeIngredients, eq(schema.saleItems.recipeId, schema.recipeIngredients.recipeId))
        .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
        .where(
            and(
                gte(schema.sales.createdAt, thirtyDaysAgo),
                eq(schema.sales.isDeleted, false)
            )
        )
        .groupBy(schema.inventory.id, schema.inventory.name)
        .orderBy(sql`total_cost DESC`)
        .limit(10);

        res.json({ success: true, data: { totalHPP, ingredientsHPP, recipeHPP: [] }, meta: { total: 1, limit: 1, page: 1 } });
    } catch (error) {
        console.error('Error calculating HPP:', error);
        res.status(500).json({ success: false, message: 'Gagal menghitung HPP' });
    }
});
