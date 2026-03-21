import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import * as schema from '../db/schema.js';
import { desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';

export const financeRouter = Router();

// GET all expenses
financeRouter.get('/expenses', async (req: Request, res: Response) => {
    try {
        const _expenses = await db.select().from(schema.expenses).orderBy(desc(schema.expenses.expenseDate));
        res.json(_expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// POST new expense
financeRouter.post('/expenses', async (req: Request, res: Response) => {
    try {
        const { title, category, amount, date, receiptUrl } = req.body;
        
        // Better validation: amount can be 0, but must be defined and a number
        if (!title || !category || amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ error: 'Missing or invalid required expense fields' });
        }

        // Validate date to prevent 500 errors from Postgres
        let expenseDate = new Date();
        if (date) {
            expenseDate = new Date(date);
            if (isNaN(expenseDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
        }

        const [newExpense] = await db.insert(schema.expenses).values({
            title,
            category,
            amount: amount.toString(),
            receiptUrl: receiptUrl || null,
            expenseDate: expenseDate
        }).returning();

        res.status(201).json(newExpense);
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ error: 'Failed to record expense' });
    }
});

// DELETE expense
financeRouter.delete('/expenses/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid expense ID' });
        }

        const [deletedExpense] = await db.delete(schema.expenses)
            .where(eq(schema.expenses.id, id))
            .returning();

        if (!deletedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// UPDATE expense
financeRouter.put('/expenses/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid expense ID' });
        }

        const { title, category, amount, date, receiptUrl } = req.body;

        if (!title || !category || amount === undefined || isNaN(Number(amount))) {
            return res.status(400).json({ error: 'Missing or invalid required expense fields' });
        }

        let expenseDate = new Date();
        if (date) {
            expenseDate = new Date(date);
            if (isNaN(expenseDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
        }

        const [updatedExpense] = await db.update(schema.expenses)
            .set({
                title,
                category,
                amount: amount.toString(),
                receiptUrl: receiptUrl || null,
                expenseDate: expenseDate
            })
            .where(eq(schema.expenses.id, id))
            .returning();

        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(updatedExpense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// GET Dashboard & P&L Report Summary
financeRouter.get('/reports', requireAdmin, async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Query Total Sales (All Time)
        const allSales = await db.select({ total: schema.sales.totalAmount }).from(schema.sales);
        const revenue = allSales.reduce((sum, current) => sum + parseFloat(current.total), 0);
        
        // 2. Query Today's Sales
        const todaySales = await db.select({ total: schema.sales.totalAmount })
            .from(schema.sales)
            .where(gte(schema.sales.createdAt, today));
        const revenueToday = todaySales.reduce((sum, current) => sum + parseFloat(current.total), 0);

        // 3. Query Total Expenses
        const allExpenses = await db.select({ total: schema.expenses.amount }).from(schema.expenses);
        const totalExpenses = allExpenses.reduce((sum, current) => sum + parseFloat(current.total), 0);

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
            revenue,
            revenueToday,
            expenses: totalExpenses,
            netProfit: revenue - totalExpenses,
            topMenus: topMenusRaw
        });

    } catch (error) {
        console.error('Error computing finance reports:', error);
        res.status(500).json({ error: 'Failed to compute financial reports' });
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
        .where(gte(schema.sales.createdAt, thirtyDaysAgo));

        const saleIds = salesInPeriod.map(s => s.id);
        if (saleIds.length === 0) {
            return res.json({ totalHPP: 0, ingredientsHPP: [], recipeHPP: [] });
        }

        const items = await db.select()
            .from(schema.saleItems)
            .where(inArray(schema.saleItems.saleId, saleIds));

        // 2. Fetch BOM for all affected recipes
        const recipeIds = [...new Set(items.map(i => i.recipeId))];
        const boms = await db.select({
            recipeId: schema.recipeIngredients.recipeId,
            inventoryId: schema.recipeIngredients.inventoryId,
            usageQty: schema.recipeIngredients.quantity,
            ingredientName: schema.inventory.name,
            pricePerUnit: schema.inventory.pricePerUnit
        })
        .from(schema.recipeIngredients)
        .innerJoin(schema.inventory, eq(schema.recipeIngredients.inventoryId, schema.inventory.id))
        .where(inArray(schema.recipeIngredients.recipeId, recipeIds));

        // 3. Calculate HPP
        let totalHPP = 0;
        const ingredientUsage: Record<number, { name: string, totalCost: number, totalQty: number }> = {};
        const recipeCosts: Record<number, { name: string, cost: number }> = {};

        for (const item of items) {
            const itemBoms = boms.filter(b => b.recipeId === item.recipeId);
            let itemTotalCost = 0;

            for (const bom of itemBoms) {
                const cost = parseFloat(bom.usageQty) * item.quantity * parseFloat(bom.pricePerUnit);
                itemTotalCost += cost;
                totalHPP += cost;

                if (!ingredientUsage[bom.inventoryId]) {
                    ingredientUsage[bom.inventoryId] = { name: bom.ingredientName, totalCost: 0, totalQty: 0 };
                }
                ingredientUsage[bom.inventoryId].totalCost += cost;
                ingredientUsage[bom.inventoryId].totalQty += parseFloat(bom.usageQty) * item.quantity;
            }
        }

        res.json({
            totalHPP,
            ingredientsHPP: Object.entries(ingredientUsage).map(([id, data]) => ({
                id: parseInt(id),
                ...data
            })).sort((a, b) => b.totalCost - a.totalCost),
            // Could add more breakdowns here
        });

    } catch (error) {
        console.error('Error calculating HPP:', error);
        res.status(500).json({ error: 'Failed to calculate HPP analysis' });
    }
});

// GET all expense categories
financeRouter.get('/expenses/categories', async (req: Request, res: Response) => {
    try {
        const cats = await db.select().from(schema.expenseCategories).orderBy(schema.expenseCategories.name);
        res.json(cats);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
});

// POST new expense category
financeRouter.post('/expenses/categories', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, icon } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required' });

        const [newCat] = await db.insert(schema.expenseCategories).values({
            name,
            icon: icon || 'category'
        }).returning();

        res.status(201).json(newCat);
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add expense category' });
    }
});

// DELETE expense category
financeRouter.delete('/expenses/categories/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

        const [deleted] = await db.delete(schema.expenseCategories)
            .where(eq(schema.expenseCategories.id, id))
            .returning();

        if (!deleted) return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete expense category' });
    }
});
