import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';

export class AnalyticsService {
    /**
     * Today's Business Summary (Profit, Revenue, Balance)
     */
    static async getDailySummary() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Revenue & Sales
        const salesData = await db.select({
            totalRevenue: sql<number>`COALESCE(SUM(CAST(${schema.sales.totalAmount} AS DECIMAL)), 0)`,
            totalRefunds: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.isVoided} = true THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
            cashRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.paymentMethod} = 'CASH' AND ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
            nonCashRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.paymentMethod} != 'CASH' AND ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`
        })
        .from(schema.sales)
        .where(and(
            gte(schema.sales.createdAt, today),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ));

        // 2. Profit (Price - Cost)
        const profitData = await db.select({
            totalCost: sql<number>`COALESCE(SUM(CAST(${schema.saleItems.costPrice} AS DECIMAL) * ${schema.saleItems.quantity}), 0)`,
            totalSelling: sql<number>`COALESCE(SUM(CAST(${schema.saleItems.subtotal} AS DECIMAL)), 0)`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .where(and(
            gte(schema.sales.createdAt, today), 
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ));

        // 3. Expenses
        const expenseData = await db.select({
            totalExpenses: sql<number>`COALESCE(SUM(CAST(${schema.expenses.amount} AS DECIMAL)), 0)`
        })
        .from(schema.expenses)
        .where(and(gte(schema.expenses.createdAt, today), eq(schema.expenses.isDeleted, false)));

        const revenue = Number(salesData[0].totalRevenue);
        const cash = Number(salesData[0].cashRevenue);
        const nonCash = Number(salesData[0].nonCashRevenue);
        const expenses = Number(expenseData[0].totalExpenses);
        const costOfGoods = Number(profitData[0].totalCost);
        const grossProfit = Number(profitData[0].totalSelling) - costOfGoods;

        return {
            revenue,
            cash,
            nonCash,
            expenses,
            grossProfit,
            netCash: cash - expenses // Expected physical cash in drawer
        };
    }

    /**
     * Active Shift Monitoring & Risk Indication
     */
    static async getShiftMonitoring() {
        const activeShifts = await db.select({
            id: schema.shifts.id,
            cashier: schema.users.name,
            startTime: schema.shifts.startTime,
            initialCash: schema.shifts.initialCash,
            status: schema.shifts.status
        })
        .from(schema.shifts)
        .innerJoin(schema.users, eq(schema.shifts.userId, schema.users.id))
        .where(eq(schema.shifts.status, 'OPEN'));

        // Risk detection thresholds
        const riskIndicator = {
            highVoidCount: false,
            highDiscrepancy: false,
            fraudAlarms: 0
        };

        // Check for price mismatch alarms today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alarmsArr = await db.select({ count: count() })
            .from(schema.auditLogs)
            .where(and(gte(schema.auditLogs.createdAt, today), eq(schema.auditLogs.action, 'FRAUD_PRICE_MISMATCH_ATTEMPT')));
        
        riskIndicator.fraudAlarms = alarmsArr[0].count;

        return {
            activeShifts,
            riskIndicator
        };
    }

    /**
     * Cashier Ranking (Simple Listing)
     */
    static async getCashierPerformance() {
        const performance = await db.select({
            name: schema.users.name,
            salesVolume: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
            voidCount: sql<number>`COUNT(CASE WHEN ${schema.sales.isVoided} = true THEN 1 END)`
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(and(
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ))
        .groupBy(schema.users.name)
        .orderBy(desc(sql`sales_volume`));

        return performance;
    }
}
