import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { desc, eq, gte, lte, inArray, sql, and } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBase64Image } from '../middleware/validateImage.js';
import ExcelJS from 'exceljs';
import { CashierShiftService } from '../services/cashierShift.service.js';
import { IdempotencyService } from '../services/idempotency.service.js';

export const financeRouter = Router();

// GET all expenses with pagination
// GET all expenses with pagination
financeRouter.get('/expenses', async (req: Request, res: Response) => {
    try {
        const { limit: qLimit, offset: qOffset, startDate, endDate } = req.query;
        console.log(`[API] GET /finance/expenses | Params: limit=${qLimit}, offset=${qOffset}, start=${startDate}, end=${endDate}`);
        
        const limit = parseInt(qLimit as string) || 20;
        const offset = parseInt(qOffset as string) || 0;

        // 1. Build dynamic where clause
        const filters = [eq(schema.expenses.isDeleted, false)];
        
        if (startDate) {
            const startStr = (startDate as string).includes('T') ? (startDate as string) : `${startDate}T00:00:00+07:00`;
            const d = new Date(startStr);
            if (!isNaN(d.getTime())) filters.push(gte(schema.expenses.expenseDate, d));
        }
        if (endDate) {
            const endStr = (endDate as string).includes('T') ? (endDate as string) : `${endDate}T23:59:59.999+07:00`;
            const d = new Date(endStr);
            if (!isNaN(d.getTime())) filters.push(lte(schema.expenses.expenseDate, d));
        }

        const whereClause = and(...filters);

        // 2. Fetch Expenses with Pagination
        const rawExpenses = await db.select({
            id: schema.expenses.id,
            title: schema.expenses.title,
            vendor: schema.expenses.vendor,
            category: schema.expenses.category,
            amount: schema.expenses.amount,
            userId: schema.expenses.userId,
            expenseDate: schema.expenses.expenseDate,
            createdAt: schema.expenses.createdAt,
            receiptUrl: schema.expenses.receiptUrl,
            externalReceiptUrl: schema.expenses.externalReceiptUrl,
            fundSource: schema.expenses.fundSource
        })
        .from(schema.expenses)
        .where(whereClause)
        .orderBy(desc(schema.expenses.expenseDate))
        .limit(limit + 1)
        .offset(offset);

        // 3. Fetch Summary for the SAME filtered period (MANDATORY)
        const summaryResult = await db.select({
            totalAmount: sql<number>`COALESCE(SUM(CAST(${schema.expenses.amount} AS DECIMAL)), 0)`,
            count: sql<number>`COUNT(*)`
        })
        .from(schema.expenses)
        .where(whereClause);

        const summary = {
            totalExpenses: Number(summaryResult[0].totalAmount),
            totalTransactions: Number(summaryResult[0].count)
        };

        const hasMore = rawExpenses.length > limit;
        const boundedExpenses = hasMore ? rawExpenses.slice(0, limit) : rawExpenses;
        
        const mappedData = boundedExpenses.map(e => ({
            id: e.id,
            title: e.title || "Tanpa Judul",
            vendor: e.vendor || null,
            category: e.category || "Uncategorized",
            amount: e.amount || "0",
            userId: e.userId || null,
            expenseDate: e.expenseDate || e.createdAt,
            createdAt: e.createdAt,
            receiptUrl: e.receiptUrl || null,
            externalReceiptUrl: e.externalReceiptUrl || null,
            hasReceipt: !!(e.receiptUrl || e.externalReceiptUrl),
            fundSource: e.fundSource || "CASHIER"
        }));
        
        res.status(200).json({ 
            success: true, 
            data: mappedData,
            summary,
            meta: {
                total: summary.totalTransactions,
                limit,
                offset,
                page: Math.floor(offset / limit),
                hasMore
            }
        });
    } catch (error: any) {
        console.error(`[CRITICAL ERROR] GET /finance/expenses`, error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengambil data pengeluaran',
            error: error?.message || 'Unknown database error'
        });
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
        // ONLY if it was originally from CASHIER fund source
        if (expenseToReverse.shiftId && expenseToReverse.fundSource === 'CASHIER') {
            await CashLedgerService.addEntry({
                shiftId: expenseToReverse.shiftId,
                type: 'expense', // Keeping type identical but value negative neutralizes the sum
                amount: -parseFloat(expenseToReverse.amount),
                referenceId: expenseToReverse.id,
                description: `Reverse Pengeluaran (KASIR): ${expenseToReverse.title}`
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
        const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
        const today = new Date(`${jakartaDate}T00:00:00+07:00`);

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
            totalHPP: sql<number>`COALESCE(SUM(CAST(${schema.saleItems.quantity} AS float) * CAST(${schema.recipeIngredients.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float)), 0)`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .innerJoin(schema.recipeIngredients, eq(schema.saleItems.recipeId, schema.recipeIngredients.recipeId))
        .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
        .where(
            and(
                gte(schema.sales.createdAt, thirtyDaysAgo),
                eq(schema.sales.isDeleted, false),
                eq(schema.sales.isVoided, false)
            )
        );

        const totalHPP = Number(hppResult[0].totalHPP);

        // 4. Ingredient-wise Attribution (Top Offenders)
        const ingredientsHPP = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            totalCost: sql<number>`SUM(CAST(${schema.saleItems.quantity} AS float) * CAST(${schema.recipeIngredients.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float))`,
            totalQty: sql<number>`SUM(CAST(${schema.saleItems.quantity} AS float) * CAST(${schema.recipeIngredients.quantity} AS float))`
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
        .orderBy(sql`SUM(${schema.saleItems.quantity} * CAST(${schema.recipeIngredients.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float)) DESC`)
        .limit(10);

        res.json({ success: true, data: { totalHPP, ingredientsHPP, recipeHPP: [] }, meta: { total: 1, limit: 1, page: 1 } });
    } catch (error) {
        console.error('Error calculating HPP:', error);
        res.status(500).json({ success: false, message: 'Gagal menghitung HPP' });
    }
});

// GET COGS (Cost of Procurement)
// Fetches total spend on 'IN' stock movements for the current month and compares with last month.
financeRouter.get('/cogs', async (req: Request, res: Response) => {
    try {
        const nowStr = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
        const d = new Date(nowStr);
        
        const currentMonthStart = new Date(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01T00:00:00+07:00`);
        
        let lastMonthY = d.getFullYear();
        let lastMonthM = d.getMonth();
        if (lastMonthM === 0) {
            lastMonthM = 12;
            lastMonthY -= 1;
        }
        const lastMonthStart = new Date(`${lastMonthY}-${lastMonthM.toString().padStart(2, '0')}-01T00:00:00+07:00`);

        // Total Procurement This Month
        const currentMonthProcurement = await db.select({
            totalAmount: sql<number>`COALESCE(SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float)), 0)`
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(
            and(
                eq(schema.stockMovements.type, 'IN'),
                gte(schema.stockMovements.createdAt, currentMonthStart)
            )
        );

        // Total Procurement Last Month
        const lastMonthProcurement = await db.select({
            totalAmount: sql<number>`COALESCE(SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float)), 0)`
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(
            and(
                eq(schema.stockMovements.type, 'IN'),
                gte(schema.stockMovements.createdAt, lastMonthStart),
                lte(schema.stockMovements.createdAt, currentMonthStart)
            )
        );

        const currentTotal = Number(currentMonthProcurement[0]?.totalAmount || 0);
        const lastTotal = Number(lastMonthProcurement[0]?.totalAmount || 0);

        let trendPercentage = 0;
        if (lastTotal > 0) {
            trendPercentage = ((currentTotal - lastTotal) / lastTotal) * 100;
        }

        // Top Expenditure Items (This Month)
        const topExpenditureItems = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            unit: schema.inventory.unit,
            imageUrl: schema.inventory.imageUrl,
            totalCost: sql<number>`SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float))`,
            totalQty: sql<number>`SUM(CAST(${schema.stockMovements.quantity} AS float))`
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(
            and(
                eq(schema.stockMovements.type, 'IN'),
                gte(schema.stockMovements.createdAt, currentMonthStart)
            )
        )
        .groupBy(schema.inventory.id, schema.inventory.name, schema.inventory.unit, schema.inventory.imageUrl)
        .orderBy(sql`SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float)) DESC`)
        .limit(10);

        res.json({
            success: true,
            data: {
                totalProcurement: currentTotal,
                trendPercentage: Number(trendPercentage.toFixed(1)),
                topExpenditureItems: topExpenditureItems.map(item => ({
                    ...item,
                    totalCost: Number(item.totalCost),
                    totalQty: Number(item.totalQty)
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching COGS:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data COGS' });
    }
});

// GET Real Profit & Loss Report
financeRouter.get('/profit-loss', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        // 1. Build date filter for Sales
        let salesFilters = [];
        if (startDate) {
            const d = new Date(`${startDate}T00:00:00+07:00`);
            if (!isNaN(d.getTime())) salesFilters.push(gte(schema.sales.createdAt, d));
        }
        if (endDate) {
            const d = new Date(`${endDate}T23:59:59.999+07:00`);
            if (!isNaN(d.getTime())) salesFilters.push(lte(schema.sales.createdAt, d));
        }
        salesFilters.push(eq(schema.sales.isDeleted, false));
        const salesWhereClause = and(...salesFilters);

        // 2. Build date filter for Expenses
        let expenseFilters = [];
        if (startDate) {
            const d = new Date(`${startDate}T00:00:00+07:00`);
            if (!isNaN(d.getTime())) expenseFilters.push(gte(schema.expenses.expenseDate, d));
        }
        if (endDate) {
            const d = new Date(`${endDate}T23:59:59.999+07:00`);
            if (!isNaN(d.getTime())) expenseFilters.push(lte(schema.expenses.expenseDate, d));
        }
        expenseFilters.push(eq(schema.expenses.isDeleted, false));
        const expenseWhereClause = and(...expenseFilters);

        // 3. Calculate Total Expenses
        const expensesResult = await db.select({
            total: sql<number>`COALESCE(SUM(CAST(${schema.expenses.amount} AS DECIMAL)), 0)`
        })
        .from(schema.expenses)
        .where(expenseWhereClause);
        
        const totalExpenses = Number(expensesResult[0].total) || 0;

        // 4. Calculate Revenue, HPP and Breakdown from saleItems
        const breakdownRaw = await db.select({
            productId: schema.recipes.id,
            name: schema.recipes.name,
            totalSold: sql<number>`SUM(CAST(${schema.saleItems.quantity} AS float))`,
            revenue: sql<number>`SUM(CAST(${schema.saleItems.subtotal} AS float))`,
            totalHPP: sql<number>`SUM(CAST(${schema.saleItems.quantity} AS float) * CAST(${schema.recipes.costPrice} AS float))`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(salesWhereClause)
        .groupBy(schema.recipes.id, schema.recipes.name)
        .orderBy(sql`SUM(CAST(${schema.saleItems.subtotal} AS float)) DESC`);

        let revenue = 0;
        let totalHPP = 0;

        const breakdown = breakdownRaw.map(item => {
            const rev = Number(item.revenue || 0);
            const hpp = Number(item.totalHPP || 0);
            revenue += rev;
            totalHPP += hpp;
            
            return {
                productId: item.productId,
                name: item.name,
                totalSold: Number(item.totalSold || 0),
                revenue: rev,
                totalHPP: hpp,
                profit: rev - hpp
            };
        });

        // 5. Final Calculation
        const grossProfit = revenue - totalHPP;
        const netProfit = grossProfit - totalExpenses;
        
        let status = 'PROFIT';
        if (netProfit < 0) status = 'LOSS';
        else if (netProfit === 0) status = 'BREAK_EVEN';

        res.json({
            success: true,
            data: {
                revenue,
                totalHPP,
                totalExpenses,
                grossProfit,
                netProfit,
                status,
                breakdown
            }
        });

    } catch (error) {
        console.error('Error fetching profit-loss:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil laporan laba rugi' });
    }
});

// GET Real Waste Analysis Report
financeRouter.get('/waste-analysis', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter for stockMovements
        let dateFilters = [];
        if (startDate) {
            const d = new Date(`${startDate}T00:00:00+07:00`);
            if (!isNaN(d.getTime())) dateFilters.push(gte(schema.stockMovements.createdAt, d));
        }
        if (endDate) {
            const d = new Date(`${endDate}T23:59:59.999+07:00`);
            if (!isNaN(d.getTime())) dateFilters.push(lte(schema.stockMovements.createdAt, d));
        }
        
        // --- 1. Total Used ---
        // type = 'OUT' represents usage or sales depletion.
        const outFilter = and(eq(schema.stockMovements.type, 'OUT'), ...dateFilters);
        const usedResult = await db.select({
            totalUsed: sql<number>`COALESCE(SUM(CAST(${schema.stockMovements.quantity} AS float)), 0)`
        })
        .from(schema.stockMovements)
        .where(outFilter);
        
        const totalUsed = Number(usedResult[0].totalUsed) || 0;

        // --- 2. Total Waste & Breakdown by Category & Inventory ---
        const wasteFilter = and(eq(schema.stockMovements.type, 'WASTE'), ...dateFilters);
        
        const wasteRaw = await db.select({
            inventoryId: schema.inventory.id,
            name: schema.inventory.name,
            reason: schema.stockMovements.reason,
            wasteQty: sql<number>`SUM(CAST(${schema.stockMovements.quantity} AS float))`,
            wasteCost: sql<number>`SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float))`
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(wasteFilter)
        .groupBy(schema.inventory.id, schema.inventory.name, schema.stockMovements.reason);

        let totalWasteQty = 0;
        let totalWasteCost = 0;
        
        // Aggregate reasons
        const reasonsMap: Record<string, { reason: string, wasteQty: number, wasteCost: number }> = {};
        // Aggregate top inventory
        const inventoryMap: Record<number, { inventoryId: number, name: string, wasteQty: number, wasteCost: number }> = {};

        wasteRaw.forEach(item => {
            const qty = Number(item.wasteQty) || 0;
            const cost = Number(item.wasteCost) || 0;
            const reason = item.reason || 'Lainnya';
            
            totalWasteQty += qty;
            totalWasteCost += cost;

            if (!reasonsMap[reason]) {
                reasonsMap[reason] = { reason, wasteQty: 0, wasteCost: 0 };
            }
            reasonsMap[reason].wasteQty += qty;
            reasonsMap[reason].wasteCost += cost;

            if (!inventoryMap[item.inventoryId]) {
                inventoryMap[item.inventoryId] = { inventoryId: item.inventoryId, name: item.name, wasteQty: 0, wasteCost: 0 };
            }
            inventoryMap[item.inventoryId].wasteQty += qty;
            inventoryMap[item.inventoryId].wasteCost += cost;
        });

        const wasteByReason = Object.values(reasonsMap)
            .sort((a, b) => b.wasteCost - a.wasteCost);
            
        const breakdownByInventory = Object.values(inventoryMap)
            .sort((a, b) => b.wasteCost - a.wasteCost)
            .slice(0, 10); // top 10

        // --- 3. Ratio ---
        let wasteRatio = 0;
        const totalActivity = totalUsed + totalWasteQty;
        if (totalActivity > 0) {
            wasteRatio = totalWasteQty / totalActivity;
        }

        // Output in %
        const wasteRatioPercent = wasteRatio * 100;
        
        let status = 'NORMAL';
        if (wasteRatioPercent > 20) {
            status = 'CRITICAL';
        } else if (wasteRatioPercent > 10) {
            status = 'WARNING';
        }

        res.json({
            success: true,
            data: {
                totalWasteQty,
                totalWasteCost,
                wasteRatio: wasteRatioPercent,
                status,
                wasteByReason,
                breakdownByInventory,
                // Compatibility for older apps/waste
                totalValueMonth: totalWasteCost,
                topOffenders: breakdownByInventory
            }
        });
    } catch (error) {
        console.error('Error fetching waste analysis:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil analisis pemborosan' });
    }
});
