import { Router } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { desc, eq, gte, inArray, sql, and } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBase64Image } from '../middleware/validateImage.js';
import ExcelJS from 'exceljs';
export const financeRouter = Router();
// GET all expenses with pagination
financeRouter.get('/expenses', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const _expenses = await db.select({
            id: schema.expenses.id,
            title: schema.expenses.title,
            vendor: schema.expenses.vendor,
            category: schema.expenses.category,
            amount: schema.expenses.amount,
            userId: schema.expenses.userId,
            expenseDate: schema.expenses.expenseDate,
            createdAt: schema.expenses.createdAt,
            receiptUrl: schema.expenses.receiptUrl, // Added
            hasReceipt: sql `CASE WHEN ${schema.expenses.receiptUrl} IS NOT NULL THEN true ELSE false END`,
            externalReceiptUrl: schema.expenses.externalReceiptUrl
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
                total: _expenses.length,
                limit,
                offset
            }
        });
    }
    catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pengeluaran' });
    }
});
// GET expense photo
financeRouter.get('/expenses/:id/photo', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil foto bukti' });
    }
});
// GET all expense categories
financeRouter.get('/expenses/categories', requireAuth, async (req, res) => {
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
    }
    catch (error) {
        console.error('[FinanceAPI] Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil kategori pengeluaran' });
    }
});
// POST new expense category
financeRouter.post('/expenses/categories', requireAdmin, async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name)
            return res.status(400).json({ success: false, message: 'Nama kategori diperlukan' });
        const categoryName = name.trim();
        // CASE-INSENSITIVE DUPLICATE CHECK
        const [existing] = await db.select()
            .from(schema.expenseCategories)
            .where(sql `lower(${schema.expenseCategories.name}) = lower(${categoryName})`)
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
    }
    catch (error) {
        console.error('[FinanceAPI] Error adding category:', error);
        // Handle unique constraint violation just in case of race condition
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
        }
        res.status(500).json({ success: false, message: 'Gagal menambah kategori pengeluaran' });
    }
});
// GET Export Expenses Excel
financeRouter.get('/expenses/export', async (req, res) => {
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
                vendor: exp.vendor || '-',
                category: exp.category,
                amount: parseFloat(exp.amount),
                date: exp.expenseDate.toLocaleString('id-ID'),
                receipt: exp.externalReceiptUrl || '-'
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Pengeluaran_Kerabat_POS.xlsx');
        await workbook.xlsx.write(res);
    }
    catch (error) {
        console.error('Export expenses error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Gagal mengekspor data pengeluaran' });
        }
    }
});
// GET Single Expense Detail (Full Details including receipt image)
financeRouter.get('/expenses/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ success: false, message: 'ID tidak valid' });
        const [expense] = await db.select({
            id: schema.expenses.id,
            title: schema.expenses.title,
            vendor: schema.expenses.vendor,
            category: schema.expenses.category,
            amount: schema.expenses.amount,
            receiptUrl: schema.expenses.receiptUrl,
            externalReceiptUrl: schema.expenses.externalReceiptUrl,
            expenseDate: schema.expenses.expenseDate,
            userId: schema.expenses.userId,
            createdAt: schema.expenses.createdAt
        }).from(schema.expenses).where(and(eq(schema.expenses.id, id), eq(schema.expenses.isDeleted, false))).limit(1);
        if (!expense)
            return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });
        res.json({ success: true, data: expense });
    }
    catch (error) {
        console.error('Error fetching expense details:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail pengeluaran' });
    }
});
// DELETE expense category
financeRouter.delete('/expenses/categories/:id', requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ success: false, message: 'ID tidak valid' });
        const [deleted] = await db.delete(schema.expenseCategories)
            .where(eq(schema.expenseCategories.id, id))
            .returning();
        if (!deleted)
            return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
        res.json({ success: true, message: 'Kategori berhasil dihapus' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
    }
});
// POST new expense
financeRouter.post('/expenses', requireAuth, validateBase64Image('receiptUrl'), async (req, res) => {
    try {
        const { title, vendor, category, amount, date, receiptUrl } = req.body;
        // Better validation: amount can be 0, but must be defined and a number
        if (!title || !category || amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ success: false, message: 'Bidang pengeluaran yang diperlukan tidak ada atau tidak valid' });
        }
        // Validate date to prevent 500 errors from Postgres
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
            userId: req.user?.id || null
        }).returning({
            id: schema.expenses.id,
            amount: schema.expenses.amount
        });
        console.log(`[FinanceAPI] Expense recorded: "${title}" | Amount: ${amount} | Receipt: ${receiptUrl ? 'YES' : 'NO'}`);
        res.status(201).json({ success: true, data: newExpense });
    }
    catch (error) {
        console.error('[FinanceAPI] Error adding expense:', error);
        res.status(500).json({ success: false, message: 'Gagal merekam pengeluaran' });
    }
});
// DELETE expense
financeRouter.delete('/expenses/:id', requireAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'ID pengeluaran tidak valid' });
        }
        const [deletedExpense] = await db.update(schema.expenses)
            .set({ isDeleted: true })
            .where(eq(schema.expenses.id, id))
            .returning();
        if (!deletedExpense) {
            return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });
        }
        res.json({ success: true, message: 'Pengeluaran berhasil dihapus' });
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus pengeluaran' });
    }
});
// UPDATE expense
financeRouter.put('/expenses/:id', requireAuth, validateBase64Image('receiptUrl'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'ID pengeluaran tidak valid' });
        }
        const { title, vendor, category, amount, date, receiptUrl } = req.body;
        if (!title || !category || amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ success: false, message: 'Bidang pengeluaran yang diperlukan tidak ada atau tidak valid' });
        }
        let expenseDate = new Date();
        if (date) {
            expenseDate = new Date(date);
            if (isNaN(expenseDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Format tanggal tidak valid' });
            }
        }
        const [updatedExpense] = await db.update(schema.expenses)
            .set({
            title,
            vendor,
            category,
            amount: amount.toString(),
            receiptUrl: receiptUrl || null,
            expenseDate: expenseDate
        })
            .where(eq(schema.expenses.id, id))
            .returning({
            id: schema.expenses.id,
            amount: schema.expenses.amount
        });
        if (!updatedExpense) {
            return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });
        }
        res.json({ success: true, data: updatedExpense });
    }
    catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui pengeluaran' });
    }
});
// GET Dashboard & P&L Report Summary
financeRouter.get('/reports', requireAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 1. Optimized Revenue Calculation (Native SQL SUM)
        const revenueResult = await db.select({
            total: sql `COALESCE(SUM(${schema.sales.totalAmount}), 0)`
        })
            .from(schema.sales)
            .where(eq(schema.sales.isDeleted, false));
        const revenue = Number(revenueResult[0].total);
        // 2. Optimized Today's Revenue (Native SQL SUM)
        const todayRevenueResult = await db.select({
            total: sql `COALESCE(SUM(${schema.sales.totalAmount}), 0)`
        })
            .from(schema.sales)
            .where(and(gte(schema.sales.createdAt, today), eq(schema.sales.isDeleted, false)));
        const revenueToday = Number(todayRevenueResult[0].total);
        // 3. Optimized Total Expenses (Native SQL SUM)
        const expenseResult = await db.select({
            total: sql `COALESCE(SUM(${schema.expenses.amount}), 0)`
        })
            .from(schema.expenses)
            .where(eq(schema.expenses.isDeleted, false));
        const totalExpenses = Number(expenseResult[0].total);
        // 4. Get Top 5 Menus (Recipe Sales Volume)
        const topMenusRaw = await db.select({
            recipeId: schema.saleItems.recipeId,
            name: schema.recipes.name,
            totalQty: sql `sum(${schema.saleItems.quantity})`
        })
            .from(schema.saleItems)
            .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
            .groupBy(schema.saleItems.recipeId, schema.recipes.name)
            .orderBy(sql `sum(${schema.saleItems.quantity}) DESC`)
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
    }
    catch (error) {
        console.error('Error computing finance reports:', error);
        res.status(500).json({ success: false, message: 'Gagal menghitung laporan keuangan' });
    }
});
// GET HPP (COGS) Analysis
financeRouter.get('/hpp', requireAdmin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 1. Get all sale items in last 30 days
        const salesInPeriod = await db.select({
            id: schema.sales.id,
            createdAt: schema.sales.createdAt
        })
            .from(schema.sales)
            .where(and(gte(schema.sales.createdAt, thirtyDaysAgo), eq(schema.sales.isDeleted, false)));
        const saleIds = salesInPeriod.map((s) => s.id);
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
        const recipeIds = [...new Set(items.map((i) => i.recipeId))];
        let boms = [];
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
            totalHPP: sql `COALESCE(SUM(${schema.saleItems.quantity} * ${schema.recipeIngredients.quantity} * ${schema.inventory.pricePerUnit}), 0)`
        })
            .from(schema.saleItems)
            .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
            .innerJoin(schema.recipeIngredients, eq(schema.saleItems.recipeId, schema.recipeIngredients.recipeId))
            .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
            .where(and(gte(schema.sales.createdAt, thirtyDaysAgo), eq(schema.sales.isDeleted, false)));
        const totalHPP = Number(hppResult[0].totalHPP);
        // 4. Ingredient-wise Attribution (Top Offenders)
        const ingredientsHPP = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            totalCost: sql `SUM(${schema.saleItems.quantity} * ${schema.recipeIngredients.quantity} * ${schema.inventory.pricePerUnit})`,
            totalQty: sql `SUM(${schema.saleItems.quantity} * ${schema.recipeIngredients.quantity})`
        })
            .from(schema.saleItems)
            .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
            .innerJoin(schema.recipeIngredients, eq(schema.saleItems.recipeId, schema.recipeIngredients.recipeId))
            .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
            .where(and(gte(schema.sales.createdAt, thirtyDaysAgo), eq(schema.sales.isDeleted, false)))
            .groupBy(schema.inventory.id, schema.inventory.name)
            .orderBy(sql `total_cost DESC`)
            .limit(10);
        res.json({ success: true, data: { totalHPP, ingredientsHPP, recipeHPP: [] }, meta: { total: 1, limit: 1, page: 1 } });
    }
    catch (error) {
        console.error('Error calculating HPP:', error);
        res.status(500).json({ success: false, message: 'Gagal menghitung HPP' });
    }
});
