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
// GET P&L (Profit & Loss) Report Summary
exports.financeRouter.get('/reports', async (req, res) => {
    try {
        // Query Total Sales (Revenue)
        const allSales = await db_1.db.select({ total: schema.sales.totalAmount }).from(schema.sales);
        const revenue = allSales.reduce((sum, current) => sum + parseFloat(current.total), 0);
        // Query Total Expenses (Cost)
        const allExpenses = await db_1.db.select({ total: schema.expenses.amount }).from(schema.expenses);
        const totalExpenses = allExpenses.reduce((sum, current) => sum + parseFloat(current.total), 0);
        // Simple P&L mock - For actual apps needs date filtering (e.g. Current Month)
        const netProfit = revenue - totalExpenses;
        res.json({
            revenue,
            expenses: totalExpenses,
            netProfit,
        });
    }
    catch (error) {
        console.error('Error computing P&L:', error);
        res.status(500).json({ error: 'Failed to compute financial reports' });
    }
});
// GET HPP (COGS) Analysis
exports.financeRouter.get('/hpp', async (req, res) => {
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
