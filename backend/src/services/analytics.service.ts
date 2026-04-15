import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, gte, lte, sql, desc, count } from 'drizzle-orm';

export class AnalyticsService {
    /**
     * Today's Business Summary (Profit, Revenue, Balance)
     */
    static async getDailySummary() {
        // 0. Robust Timezone Handling (Asia/Jakarta)
        const now = new Date();
        const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now); 
        const todayStart = new Date(`${jakartaDate}T00:00:00+07:00`); 

        // 1. Revenue & Sales
        const salesData = await db.select({
            totalRevenue: sql<number>`COALESCE(SUM(CAST(${schema.sales.totalAmount} AS DECIMAL)), 0)`,
            cashRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.paymentMethod} = 'CASH' AND ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
            nonCashRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.paymentMethod} != 'CASH' AND ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`
        })
        .from(schema.sales)
        .where(and(
            gte(schema.sales.createdAt, todayStart),
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
            gte(schema.sales.createdAt, todayStart), 
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ));

        // 3. Expenses
        const expenseData = await db.select({
            totalExpenses: sql<number>`COALESCE(SUM(CAST(${schema.expenses.amount} AS DECIMAL)), 0)`
        })
        .from(schema.expenses)
        .where(and(gte(schema.expenses.createdAt, todayStart), eq(schema.expenses.isDeleted, false)));

        // 4. Initial Cash from OPEN shifts (Real-time in Drawer)
        const activeShiftsCash = await db.select({
            totalInitial: sql<number>`COALESCE(SUM(CAST(${schema.shifts.initialCash} AS DECIMAL)), 0)`
        })
        .from(schema.shifts)
        .where(eq(schema.shifts.status, 'OPEN'));

        // Extract values safely
        const revenue = salesData[0] ? Number(salesData[0].totalRevenue) : 0;
        const cashSales = salesData[0] ? Number(salesData[0].cashRevenue) : 0;
        const nonCash = salesData[0] ? Number(salesData[0].nonCashRevenue) : 0;
        const expenses = expenseData[0] ? Number(expenseData[0].totalExpenses) : 0;
        const initialCash = activeShiftsCash[0] ? Number(activeShiftsCash[0].totalInitial) : 0;
        
        const costOfGoods = profitData[0] ? Number(profitData[0].totalCost) : 0;
        const totalSelling = profitData[0] ? Number(profitData[0].totalSelling) : 0;
        const grossProfit = totalSelling - costOfGoods;

        // Cash in drawer = Modal + Penjualan Tunai - Pengeluaran
        const currentCashInDrawer = initialCash + cashSales - expenses;

        return {
            revenue,
            cash: currentCashInDrawer,
            nonCash,
            expenses,
            grossProfit,
            netCash: currentCashInDrawer
        };
    }

    /**
     * Recent transactions from today
     */
    static async getTodayRecentSales(limit = 10) {
        const now = new Date();
        const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now); 
        const todayStart = new Date(`${jakartaDate}T00:00:00+07:00`); 

        return await db.select({
            id: schema.sales.id,
            totalAmount: schema.sales.totalAmount,
            paymentMethod: schema.sales.paymentMethod,
            customerInfo: schema.sales.customerInfo,
            status: schema.sales.status,
            createdAt: schema.sales.createdAt,
            cashier: schema.users.name
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(and(
            gte(schema.sales.createdAt, todayStart),
            eq(schema.sales.isDeleted, false)
        ))
        .orderBy(desc(schema.sales.createdAt))
        .limit(limit);
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
     * Comprehensive Dashboard Analytics with Date Range Support
     */
    static async getDashboardAnalytics(range: { start: Date; end: Date }) {
        const { start, end } = range;

        // 1. Summary Metrics
        const salesSummary = await db.select({
            totalRevenue: sql<number>`COALESCE(SUM(CAST(${schema.sales.totalAmount} AS DECIMAL)), 0)`,
            transactionCount: sql<number>`COUNT(${schema.sales.id})`,
            cashRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.paymentMethod} = 'CASH' AND ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`,
            nonCashRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${schema.sales.paymentMethod} != 'CASH' AND ${schema.sales.isVoided} = false THEN CAST(${schema.sales.totalAmount} AS DECIMAL) ELSE 0 END), 0)`
        })
        .from(schema.sales)
        .where(and(
            gte(schema.sales.createdAt, start),
            lte(schema.sales.createdAt, end),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ));

        const revenue = Number(salesSummary[0]?.totalRevenue || 0);
        const transCount = Number(salesSummary[0]?.transactionCount || 0);
        const avgOrder = transCount > 0 ? revenue / transCount : 0;

        const expenseData = await db.select({
            total: sql<number>`COALESCE(SUM(CAST(${schema.expenses.amount} AS DECIMAL)), 0)`
        })
        .from(schema.expenses)
        .where(and(
            gte(schema.expenses.createdAt, start),
            lte(schema.expenses.createdAt, end),
            eq(schema.expenses.isDeleted, false)
        ));
        const totalExpenses = Number(expenseData[0]?.total || 0);

        const profitData = await db.select({
            totalCost: sql<number>`COALESCE(SUM(CAST(${schema.saleItems.costPrice} AS DECIMAL) * ${schema.saleItems.quantity}), 0)`,
            totalSelling: sql<number>`COALESCE(SUM(CAST(${schema.saleItems.subtotal} AS DECIMAL)), 0)`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .where(and(
            gte(schema.sales.createdAt, start),
            lte(schema.sales.createdAt, end),
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ));
        const grossProfit = Number(profitData[0]?.totalSelling || 0) - Number(profitData[0]?.totalCost || 0);

        // 2. Hourly Sales (Line Chart)
        // Group by hour in WIB
        const hourlySales = await db.execute(sql`
            SELECT 
                EXTRACT(HOUR FROM ${schema.sales.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta') as hour,
                COALESCE(SUM(CAST(${schema.sales.totalAmount} AS DECIMAL)), 0) as total
            FROM sales
            WHERE created_at >= ${start.toISOString()} AND created_at <= ${end.toISOString()}
                AND is_deleted = false AND is_voided = false AND status = 'PAID'
            GROUP BY hour
            ORDER BY hour ASC
        `);

        // 3. Top 5 Products
        const topProducts = await db.select({
            name: schema.recipes.name,
            totalQty: sql<number>`SUM(${schema.saleItems.quantity})`,
            totalRevenue: sql<number>`SUM(CAST(${schema.saleItems.subtotal} AS DECIMAL))`
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .where(and(
            gte(schema.sales.createdAt, start),
            lte(schema.sales.createdAt, end),
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ))
        .groupBy(schema.recipes.name)
        .orderBy(desc(sql`SUM(${schema.saleItems.quantity})`))
        .limit(5);

        // 4. Payment Methods (Pie Chart)
        const paymentMethods = await db.select({
            method: schema.sales.paymentMethod,
            count: count(),
            total: sql<number>`SUM(CAST(${schema.sales.totalAmount} AS DECIMAL))`
        })
        .from(schema.sales)
        .where(and(
            gte(schema.sales.createdAt, start),
            lte(schema.sales.createdAt, end),
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false)
        ))
        .groupBy(schema.sales.paymentMethod);

        // 5. Cashier Performance
        const cashierPerformance = await db.select({
            name: schema.users.name,
            salesVolume: sql<number>`COALESCE(SUM(CAST(${schema.sales.totalAmount} AS DECIMAL)), 0)`,
            transactionCount: count()
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(and(
            gte(schema.sales.createdAt, start),
            lte(schema.sales.createdAt, end),
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false),
            eq(schema.sales.status, 'PAID')
        ))
        .groupBy(schema.users.name)
        .orderBy(desc(sql`COALESCE(SUM(CAST(${schema.sales.totalAmount} AS DECIMAL)), 0)`));

        // 6. Alerts
        const alerts = [];
        
        // Voids
        const voidedSales = await db.select({
            id: schema.sales.id,
            amount: schema.sales.totalAmount,
            reason: schema.sales.voidReason,
            time: schema.sales.createdAt,
            cashier: schema.users.name
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(and(
            gte(schema.sales.createdAt, start),
            lte(schema.sales.createdAt, end),
            eq(schema.sales.isVoided, true),
            eq(schema.sales.isDeleted, false)
        ))
        .limit(10);

        for (const v of voidedSales) {
            alerts.push({
                type: 'VOID',
                message: `Transaksi #${v.id} senilai Rp ${Number(v.amount).toLocaleString()} di-void oleh ${v.cashier}`,
                detail: v.reason || 'Sesuai permintaan pelanggan',
                time: v.time
            });
        }

        // Discrepancies
        const discrepancies = await db.select({
            id: schema.shifts.id,
            discrepancy: schema.shifts.discrepancy,
            cashier: schema.users.name,
            time: schema.shifts.endTime
        })
        .from(schema.shifts)
        .innerJoin(schema.users, eq(schema.shifts.userId, schema.users.id))
        .where(and(
            gte(schema.shifts.endTime, start),
            lte(schema.shifts.endTime, end),
            eq(schema.shifts.isDeleted, false),
            sql`CAST(${schema.shifts.discrepancy} AS DECIMAL) != 0`
        ))
        .limit(5);

        for (const d of discrepancies) {
            alerts.push({
                type: 'DISCREPANCY',
                message: `Selisih kasir ${d.cashier} sebesar Rp ${Number(d.discrepancy).toLocaleString()}`,
                detail: `Shift #${d.id}`,
                time: d.time
            });
        }

        return {
            summary: {
                totalRevenue: revenue,
                totalTransactions: transCount,
                avgOrderValue: avgOrder,
                totalExpenses,
                grossProfit: grossProfit - totalExpenses // User wants Profit Kotor (Revenue - Expenses) or (Total Selling - Cost - Expenses)?
                // Goal description: Profit Kotor (Revenue - Expenses)
            },
            hourlySales: hourlySales.rows,
            topProducts,
            paymentMethods,
            cashierPerformance,
            alerts: alerts.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()),
            expenses: {
                total: totalExpenses,
                recent: await db.select()
                    .from(schema.expenses)
                    .where(and(gte(schema.expenses.createdAt, start), lte(schema.expenses.createdAt, end), eq(schema.expenses.isDeleted, false)))
                    .orderBy(desc(schema.expenses.createdAt))
                    .limit(5)
            }
        };
    }

    /**
     * Detailed Shift-based Daily Reports for Owner
     */
    static async getShiftReports(range: { start: Date; end: Date }) {
        const { start, end } = range;

        const reports = await db.select({
            id: schema.shifts.id,
            startTime: schema.shifts.startTime,
            endTime: schema.shifts.endTime,
            initialCash: schema.shifts.initialCash,
            status: schema.shifts.status,
            cashierName: schema.users.name,
            totalSales: sql<number>`COALESCE((
                SELECT SUM(CAST(total_amount AS DECIMAL)) 
                FROM sales 
                WHERE shift_id = ${schema.shifts.id} 
                    AND is_voided = false 
                    AND is_deleted = false 
                    AND status = 'PAID'
            ), 0)`,
            cashSales: sql<number>`COALESCE((
                SELECT SUM(CAST(total_amount AS DECIMAL)) 
                FROM sales 
                WHERE shift_id = ${schema.shifts.id} 
                    AND is_voided = false 
                    AND is_deleted = false 
                    AND status = 'PAID'
                    AND payment_method = 'CASH'
            ), 0)`,
            totalExpenses: sql<number>`COALESCE((
                SELECT SUM(CAST(amount AS DECIMAL)) 
                FROM expenses 
                WHERE shift_id = ${schema.shifts.id} 
                    AND is_deleted = false
            ), 0)`,
            transactionCount: sql<number>`(
                SELECT COUNT(*) 
                FROM sales 
                WHERE shift_id = ${schema.shifts.id} 
                    AND is_deleted = false 
                    AND status = 'PAID'
            )`
        })
        .from(schema.shifts)
        .innerJoin(schema.users, eq(schema.shifts.userId, schema.users.id))
        .where(and(
            gte(schema.shifts.startTime, start),
            lte(schema.shifts.startTime, end),
            eq(schema.shifts.isDeleted, false)
        ))
        .orderBy(desc(schema.shifts.startTime));

        return reports.map(r => {
            const initial = Number(r.initialCash || 0);
            const sales = Number(r.totalSales || 0);
            const cashSales = Number(r.cashSales || 0);
            const expenses = Number(r.totalExpenses || 0);
            
            // cashDrawer = initialCash + cashSales - expenses
            const cashDrawer = initial + cashSales - expenses;
            const profit = sales - expenses;

            return {
                id: r.id,
                date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(r.startTime)),
                startTime: new Date(r.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                endTime: r.endTime ? new Date(r.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Masih Berjalan',
                initialCash: initial,
                totalSales: sales,
                totalExpenses: expenses,
                cashIn: 0, // Fallback as requested
                cashOut: expenses,
                cashDrawer: cashDrawer,
                profit: profit,
                status: r.status,
                cashierName: r.cashierName,
                totalTransactions: Number(r.transactionCount || 0)
            };
        });
    }
}

