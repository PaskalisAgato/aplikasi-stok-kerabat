import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';

export class CashierShiftService {
    static async getActiveShift(userId: string) {
        const activeShifts = await db.select()
            .from(schema.shifts)
            .where(
                and(
                    eq(schema.shifts.userId, userId),
                    eq(schema.shifts.status, 'OPEN')
                )
            )
            .limit(1);
        
        return activeShifts.length > 0 ? activeShifts[0] : null;
    }

    static async openShift(userId: string, initialCash: number) {
        // Check if there's already an open shift
        const existing = await this.getActiveShift(userId);
        if (existing) {
            throw new Error('Anda masih memiliki shift yang terbuka. Tutup shift sebelumnya terlebih dahulu.');
        }

        const [newShift] = await db.insert(schema.shifts).values({
            userId,
            startTime: new Date(),
            initialCash: initialCash.toString(),
            expectedCash: initialCash.toString(),
            expectedNonCash: '0',
            status: 'OPEN',
            totalSalesCount: 0,
            totalItemsSold: 0
        }).returning();

        // Audit Log
        await db.insert(schema.auditLogs).values({
            userId,
            action: 'OPEN_SHIFT',
            tableName: 'shifts',
            newData: JSON.stringify(newShift),
            createdAt: new Date()
        });

        return newShift;
    }

    static async getShiftSummary(shiftId: number) {
        // 1. Get Sales Summary
        const salesData = await db.select({
            count: sql<number>`count(${schema.sales.id})`,
            totalAmount: sql<string>`sum(cast(${schema.sales.totalAmount} as decimal))`,
            cashAmount: sql<string>`sum(case when ${schema.sales.paymentMethod} = 'CASH' then cast(${schema.sales.totalAmount} as decimal) else 0 end)`,
            nonCashAmount: sql<string>`sum(case when ${schema.sales.paymentMethod} != 'CASH' then cast(${schema.sales.totalAmount} as decimal) else 0 end)`,
        })
        .from(schema.sales)
        .where(and(eq(schema.sales.shiftId, shiftId), eq(schema.sales.isVoided, false), eq(schema.sales.isDeleted, false)));

        // 2. Get Expenses
        const expensesData = await db.select({
            total: sql<string>`sum(cast(${schema.expenses.amount} as decimal))`
        })
        .from(schema.expenses)
        .where(and(eq(schema.expenses.shiftId, shiftId), eq(schema.expenses.isDeleted, false)));

        // 3. Get Items Sold
        const itemsData = await db.select({
            totalItems: sql<number>`sum(${schema.saleItems.quantity})`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .where(and(eq(schema.sales.shiftId, shiftId), eq(schema.sales.isVoided, false), eq(schema.sales.isDeleted, false)));

        // 4. Breakdown by Category
        const categoryData = await db.select({
            category: schema.recipes.category,
            total: sql<string>`sum(cast(${schema.saleItems.subtotal} as decimal))`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(and(eq(schema.sales.shiftId, shiftId), eq(schema.sales.isVoided, false), eq(schema.sales.isDeleted, false)))
        .groupBy(schema.recipes.category);

        // 5. Breakdown by Payment Method
        const paymentData = await db.select({
            method: schema.sales.paymentMethod,
            total: sql<string>`sum(cast(${schema.sales.totalAmount} as decimal))`
        })
        .from(schema.sales)
        .where(and(eq(schema.sales.shiftId, shiftId), eq(schema.sales.isVoided, false), eq(schema.sales.isDeleted, false)))
        .groupBy(schema.sales.paymentMethod);

        const summary = {
            salesCount: Number(salesData[0]?.count || 0),
            totalOmzet: parseFloat(salesData[0]?.totalAmount || '0'),
            totalCashSales: parseFloat(salesData[0]?.cashAmount || '0'),
            totalNonCashSales: parseFloat(salesData[0]?.nonCashAmount || '0'),
            totalExpenses: parseFloat(expensesData[0]?.total || '0'),
            totalItemsSold: Number(itemsData[0]?.totalItems || 0),
            categories: categoryData.map(c => ({ name: c.category, total: parseFloat(c.total) })),
            payments: paymentData.map(p => ({ method: p.method, total: parseFloat(p.total) }))
        };

        return summary;
    }

    static async closeShift(shiftId: number, data: { actualCash: number, actualNonCash: number, notes: string, userId: string }) {
        const { actualCash, actualNonCash, notes, userId } = data;

        const summary = await this.getShiftSummary(shiftId);
        const shiftArr = await db.select().from(schema.shifts).where(eq(schema.shifts.id, shiftId)).limit(1);
        if (shiftArr.length === 0) throw new Error('Shift tidak ditemukan.');
        const shift = shiftArr[0];

        const initialCash = parseFloat(shift.initialCash);
        const expectedCash = initialCash + summary.totalCashSales - summary.totalExpenses;
        const expectedNonCash = summary.totalNonCashSales;

        const discrepancy = actualCash - expectedCash;

        const [closedShift] = await db.update(schema.shifts).set({
            endTime: new Date(),
            expectedCash: expectedCash.toString(),
            expectedNonCash: expectedNonCash.toString(),
            totalCashActual: actualCash.toString(),
            totalNonCashActual: actualNonCash.toString(),
            discrepancy: discrepancy.toString(),
            cashierNotes: notes,
            totalSalesCount: summary.salesCount,
            totalItemsSold: summary.totalItemsSold,
            status: 'CLOSED'
        })
        .where(eq(schema.shifts.id, shiftId))
        .returning();

        // Audit Log
        await db.insert(schema.auditLogs).values({
            userId,
            action: 'CLOSE_SHIFT',
            tableName: 'shifts',
            newData: JSON.stringify(closedShift),
            createdAt: new Date()
        });

        return { ...closedShift, summary };
    }
}
