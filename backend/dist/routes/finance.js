"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.financeRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
exports.financeRouter = (0, express_1.Router)();
// GET all expenses
exports.financeRouter.get('/expenses', async (req, res) => {
    try {
        const _expenses = await db_1.db.select().from(schema.expenses).orderBy((0, drizzle_orm_1.desc)(schema.expenses.expenseDate));
        res.json(_expenses);
    }
    catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});
// POST new expense
exports.financeRouter.post('/expenses', async (req, res) => {
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
        const [newExpense] = await db_1.db.insert(schema.expenses).values({
            title,
            category,
            amount: amount.toString(),
            receiptUrl: receiptUrl || null,
            expenseDate: expenseDate
        }).returning();
        res.status(201).json(newExpense);
    }
    catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ error: 'Failed to record expense' });
    }
});
// DELETE expense
exports.financeRouter.delete('/expenses/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid expense ID' });
        }
        const [deletedExpense] = await db_1.db.delete(schema.expenses)
            .where((0, drizzle_orm_1.eq)(schema.expenses.id, id))
            .returning();
        if (!deletedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});
// UPDATE expense
exports.financeRouter.put('/expenses/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
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
        const [updatedExpense] = await db_1.db.update(schema.expenses)
            .set({
            title,
            category,
            amount: amount.toString(),
            receiptUrl: receiptUrl || null,
            expenseDate: expenseDate
        })
            .where((0, drizzle_orm_1.eq)(schema.expenses.id, id))
            .returning();
        if (!updatedExpense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(updatedExpense);
    }
    catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});
// GET Dashboard & P&L Report Summary
exports.financeRouter.get('/reports', auth_1.requireAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 1. Query Total Sales (All Time)
        const allSales = await db_1.db.select({ total: schema.sales.totalAmount }).from(schema.sales);
        const revenue = allSales.reduce((sum, current) => sum + parseFloat(current.total), 0);
        // 2. Query Today's Sales
        const todaySales = await db_1.db.select({ total: schema.sales.totalAmount })
            .from(schema.sales)
            .where((0, drizzle_orm_1.gte)(schema.sales.createdAt, today));
        const revenueToday = todaySales.reduce((sum, current) => sum + parseFloat(current.total), 0);
        // 3. Query Total Expenses
        const allExpenses = await db_1.db.select({ total: schema.expenses.amount }).from(schema.expenses);
        const totalExpenses = allExpenses.reduce((sum, current) => sum + parseFloat(current.total), 0);
        // 4. Get Top 5 Menus (Recipe Sales Volume)
        const topMenusRaw = await db_1.db.select({
            recipeId: schema.saleItems.recipeId,
            name: schema.recipes.name,
            totalQty: (0, drizzle_orm_1.sql) `sum(${schema.saleItems.quantity})`
        })
            .from(schema.saleItems)
            .innerJoin(schema.recipes, (0, drizzle_orm_1.eq)(schema.saleItems.recipeId, schema.recipes.id))
            .groupBy(schema.saleItems.recipeId, schema.recipes.name)
            .orderBy((0, drizzle_orm_1.sql) `sum(${schema.saleItems.quantity}) DESC`)
            .limit(5);
        res.json({
            revenue,
            revenueToday,
            expenses: totalExpenses,
            netProfit: revenue - totalExpenses,
            topMenus: topMenusRaw
        });
    }
    catch (error) {
        console.error('Error computing finance reports:', error);
        res.status(500).json({ error: 'Failed to compute financial reports' });
    }
});
// GET HPP (COGS) Analysis
exports.financeRouter.get('/hpp', auth_1.requireAdmin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 1. Get all sale items in last 30 days
        const salesInPeriod = await db_1.db.select({
            id: schema.sales.id,
            createdAt: schema.sales.createdAt
        })
            .from(schema.sales)
            .where((0, drizzle_orm_1.gte)(schema.sales.createdAt, thirtyDaysAgo));
        const saleIds = salesInPeriod.map(s => s.id);
        if (saleIds.length === 0) {
            return res.json({ totalHPP: 0, ingredientsHPP: [], recipeHPP: [] });
        }
        const items = await db_1.db.select()
            .from(schema.saleItems)
            .where((0, drizzle_orm_1.inArray)(schema.saleItems.saleId, saleIds));
        // 2. Fetch BOM for all affected recipes
        const recipeIds = [...new Set(items.map(i => i.recipeId))];
        const boms = await db_1.db.select({
            recipeId: schema.recipeIngredients.recipeId,
            inventoryId: schema.recipeIngredients.inventoryId,
            usageQty: schema.recipeIngredients.quantity,
            ingredientName: schema.inventory.name,
            pricePerUnit: schema.inventory.pricePerUnit
        })
            .from(schema.recipeIngredients)
            .innerJoin(schema.inventory, (0, drizzle_orm_1.eq)(schema.recipeIngredients.inventoryId, schema.inventory.id))
            .where((0, drizzle_orm_1.inArray)(schema.recipeIngredients.recipeId, recipeIds));
        // 3. Calculate HPP
        let totalHPP = 0;
        const ingredientUsage = {};
        const recipeCosts = {};
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
    }
    catch (error) {
        console.error('Error calculating HPP:', error);
        res.status(500).json({ error: 'Failed to calculate HPP analysis' });
    }
});
// GET all expense categories
exports.financeRouter.get('/expenses/categories', async (req, res) => {
    try {
        const cats = await db_1.db.select().from(schema.expenseCategories).orderBy(schema.expenseCategories.name);
        res.json(cats);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
});
// POST new expense category
exports.financeRouter.post('/expenses/categories', auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Category name is required' });
        const [newCat] = await db_1.db.insert(schema.expenseCategories).values({
            name,
            icon: icon || 'category'
        }).returning();
        res.status(201).json(newCat);
    }
    catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add expense category' });
    }
});
// DELETE expense category
exports.financeRouter.delete('/expenses/categories/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ error: 'Invalid ID' });
        const [deleted] = await db_1.db.delete(schema.expenseCategories)
            .where((0, drizzle_orm_1.eq)(schema.expenseCategories.id, id))
            .returning();
        if (!deleted)
            return res.status(404).json({ error: 'Category not found' });
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete expense category' });
    }
});
