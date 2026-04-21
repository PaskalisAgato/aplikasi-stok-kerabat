import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, and, sql, desc, sum, ne, or, isNull } from 'drizzle-orm';
import { CashLedgerService } from './cashLedger.service.js';

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
        const shiftArr = await db.select().from(schema.shifts).where(eq(schema.shifts.id, shiftId)).limit(1);
        if (shiftArr.length === 0) throw new Error('Shift tidak ditemukan.');
        const shift = shiftArr[0];

        // 1. IF CLOSED & SNAPSHOT EXISTS -> RETURN IMMUTABLE TRUTH
        if (shift.status === 'CLOSED' && shift.ledgerSnapshot) {
            try {
                return JSON.parse(shift.ledgerSnapshot);
            } catch (e) {
                console.error('[Snapshot Error] Failed to parse ledger snapshot:', e);
            }
        }

        // 2. LIVE CALCULATION (From Cash Ledger Source of Truth)
        // Join with sales AND expenses to verify if the referenced entity is deleted/voided
        const ledgerEntriesWithRefs = await db.select({
            ledger: schema.cashLedger,
            saleDeleted: schema.sales.isDeleted,
            saleVoided: schema.sales.isVoided,
            expenseDeleted: schema.expenses.isDeleted
        })
        .from(schema.cashLedger)
        .leftJoin(schema.sales, eq(schema.cashLedger.referenceId, schema.sales.id))
        .leftJoin(schema.expenses, eq(schema.cashLedger.referenceId, schema.expenses.id))
        .where(eq(schema.cashLedger.shiftId, shiftId));
        
        const cashFlow = ledgerEntriesWithRefs.reduce((acc, row) => {
            const entry = row.ledger;
            
            // SECURITY FILTER: If it's a sale entry and the sale was deleted, IGNORE IT
            if (entry.type === 'sale' && row.saleDeleted) return acc;
            
            // If it's a voided sale, the original sale and refund should neutralize each other. 
            // In Anti-Fraud view, we usually keep them, but if user wants "clean history", 
            // we filter if both entries refer to a voided sale.
            if (entry.type === 'sale' && row.saleVoided) return acc;
            if (entry.type === 'refund' && row.saleVoided) return acc;
            
            // If it's an expense entry and the expense was reversed/deleted, IGNORE IT
            if (entry.type === 'expense' && row.expenseDeleted) return acc;

            const val = parseFloat(entry.amount);
            if (entry.type === 'sale') acc.sale += val;
            if (entry.type === 'expense') acc.expense += val;
            if (entry.type === 'refund') acc.refund += val;
            if (entry.type === 'adjustment') acc.adjustment += val;
            return acc;
        }, { sale: 0, expense: 0, refund: 0, adjustment: 0 });

        const salesData = await db.select({
            count: sql<number>`count(${schema.sales.id})`,
            totalAmount: sql<string>`sum(${schema.sales.totalAmount})`,
            nonCashAmount: sql<string>`sum(case when ${schema.sales.paymentMethod} != 'CASH' then ${schema.sales.totalAmount} else 0 end)`
        })
        .from(schema.sales)
        .where(and(
            eq(schema.sales.shiftId, shiftId), 
            eq(schema.sales.status, 'PAID'),
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false)
        ));

        const itemsData = await db.select({
            totalItems: sql<number>`sum(${schema.saleItems.quantity})`
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .where(and(
            eq(schema.sales.shiftId, shiftId), 
            eq(schema.sales.status, 'PAID'),
            eq(schema.sales.isVoided, false),
            eq(schema.sales.isDeleted, false)
        ));

        const summary = {
            shiftId,
            status: shift.status,
            startTime: shift.startTime,
            endTime: shift.endTime,
            initialCash: parseFloat(shift.initialCash),
            salesCount: Number(salesData[0]?.count || 0),
            totalOmzet: parseFloat(salesData[0]?.totalAmount || '0'),
            totalCashSales: cashFlow.sale, // LEDGER AS SOURCE OF TRUTH
            totalNonCashSales: parseFloat(salesData[0]?.nonCashAmount || '0'),
            totalExpenses: Math.abs(cashFlow.expense),
            totalRefunds: cashFlow.refund,
            totalAdjustments: cashFlow.adjustment,
            totalItemsSold: Number(itemsData[0]?.totalItems || 0),
            ledgerAudit: cashFlow, // Detailed audit trail
            nonCashTransactions: await db.select({
                id: schema.sales.id,
                total: schema.sales.totalAmount,
                method: schema.sales.paymentMethod,
                ref: schema.sales.paymentReferenceId,
                time: schema.sales.createdAt
            })
            .from(schema.sales)
            .where(and(
                eq(schema.sales.shiftId, shiftId), 
                ne(schema.sales.paymentMethod, 'CASH'), 
                eq(schema.sales.status, 'PAID'),
                eq(schema.sales.isVoided, false),
                eq(schema.sales.isDeleted, false)
            ))
        };

        return summary;
    }

    static async closeShift(shiftId: number, data: { denominations: {nominal: number, qty: number}[], actualNonCash: number, notes: string, userId: string, nonCashVerified: boolean }) {
        const { denominations, actualNonCash, notes, userId, nonCashVerified } = data;

        if (!nonCashVerified) {
            throw new Error('Anda harus memverifikasi semua transaksi non-cash sebelum bisa menutup shift.');
        }

        const shiftArr = await db.select().from(schema.shifts).where(eq(schema.shifts.id, shiftId)).limit(1);
        if (shiftArr.length === 0) throw new Error('Shift tidak ditemukan.');
        const shift = shiftArr[0];
        
        // Anti-Fraud Logics (Single Source of Truth)
        const ledgerSummary = await CashLedgerService.getSummary(shiftId);
        
        const initialCash = parseFloat(shift.initialCash);
        const expectedCash = initialCash + ledgerSummary.sale - ledgerSummary.expense + ledgerSummary.refund; // refunds are usually negative in db but lets be safe if it's already negative

        // Get missing legacy fields 
        const summary = await this.getShiftSummary(shiftId);
        const expectedNonCash = summary.totalNonCashSales;

        // Normalize denominations to array (could be Record<string, number> from older frontend or bug)
        const denomsArray: { nominal: number; qty: number }[] = Array.isArray(denominations) 
            ? denominations 
            : (denominations && typeof denominations === 'object')
                ? Object.entries(denominations).map(([nominal, qty]) => ({ nominal: parseInt(nominal), qty: Number(qty) }))
                : [];

        // Calculate actual cash from physical denominations
        const actualCash = denomsArray.reduce((acc, d) => {
            // Nominal 1 = Coins/Direct Total input
            if (d.nominal === 1) return acc + d.qty;
            return acc + (d.nominal * d.qty);
        }, 0);
        const discrepancy = actualCash - expectedCash;

        return await db.transaction(async (tx) => {
            const [closedShift] = await tx.update(schema.shifts).set({
                endTime: new Date(),
                expectedCash: expectedCash.toString(),
                expectedNonCash: expectedNonCash.toString(),
                totalCashActual: actualCash.toString(),
                totalNonCashActual: actualNonCash.toString(),
                discrepancy: discrepancy.toString(),
                cashierNotes: notes,
                totalSalesCount: summary.salesCount,
                totalItemsSold: summary.totalItemsSold,
                status: 'CLOSED',
                ledgerSnapshot: JSON.stringify(summary) // LOCK THE TRUTH
            })
            .where(eq(schema.shifts.id, shiftId))
            .returning();

            // Insert denominations tracing
            if (denomsArray && denomsArray.length > 0) {
                const denomsData = denomsArray.map(d => ({
                    shiftId,
                    nominal: d.nominal,
                    qty: d.qty,
                    total: d.nominal === 1 ? d.qty.toString() : (d.nominal * d.qty).toString()
                }));
                await tx.insert(schema.shiftCashDenominations).values(denomsData);
            }

            // Audit Log
            await tx.insert(schema.auditLogs).values({
                userId,
                action: 'CLOSE_SHIFT_ANTI_FRAUD',
                tableName: 'shifts',
                newData: JSON.stringify({ closedShift, denominations }),
                createdAt: new Date()
            });

            return { ...closedShift, summary, actualCash, discrepancy };
        });
    }

    static async handoverShift(fromShiftId: number, toUserId: string, cashAmount: number, approvedBy1: string, approvedBy2: string) {
        // Verify fromShift
        const fromShiftArr = await db.select().from(schema.shifts).where(eq(schema.shifts.id, fromShiftId)).limit(1);
        if (fromShiftArr.length === 0) throw new Error('Shift asal tidak ditemukan.');
        const fromShift = fromShiftArr[0];

        // AUTO-CLOSE if shift is still open (UX simplification)
        if (fromShift.status !== 'CLOSED') {
            const summary = await this.getShiftSummary(fromShiftId);
            await this.closeShift(fromShiftId, {
                denominations: [{ nominal: 1, qty: cashAmount }], // Treat total cash as 1 chunk
                actualNonCash: summary.totalNonCashSales, // Assume non-cash matches for handover speed
                notes: 'Auto-closed via Handover',
                userId: fromShift.userId,
                nonCashVerified: true // Auto verify non-cash during handover
            });
        } else {
            // If already closed, enforce exact cash matching
            const actualFromCash = parseFloat(fromShift.totalCashActual || '0');
            if (cashAmount !== actualFromCash) {
                throw new Error(`Uang kas tidak valid! Uang penutupan kasir sebelumnya adalah Rp ${actualFromCash}, tapi Anda menyerahkan Rp ${cashAmount}.`);
            }
        }

        // Verify toUser doesn't have an active shift
        const existingToShift = await this.getActiveShift(toUserId);
        if (existingToShift) {
            throw new Error('Kasir penerima masih memiliki shift aktif. Silahkan tutup terlebih dahulu.');
        }


        return await db.transaction(async (tx) => {
            // 1. Create new shift for toUserId
            const [newShift] = await tx.insert(schema.shifts).values({
                userId: toUserId,
                startTime: new Date(),
                initialCash: cashAmount.toString(),
                expectedCash: cashAmount.toString(),
                status: 'OPEN',
                totalSalesCount: 0,
                totalItemsSold: 0
            }).returning();

            // 2. Insert handover evidence
            await tx.insert(schema.shiftHandover).values({
                shiftFrom: fromShift.id,
                shiftTo: newShift.id,
                cashAmount: cashAmount.toString(),
                approvedBy1, // The pin-checker handled this in the middleware, these are user IDs
                approvedBy2,
                timestamp: new Date()
            });

            // 3. Log Audit
            await tx.insert(schema.auditLogs).values({
                userId: approvedBy2,
                action: 'SHIFT_HANDOVER',
                tableName: 'shifts',
                newData: JSON.stringify({ fromShiftId: fromShift.id, toShiftId: newShift.id, cashAmount }),
                createdAt: new Date()
            });

            return newShift;
        });
    }

    static async deleteShift(id: number, currentUserId: string) {
        return await db.transaction(async (tx) => {
            const [oldShift] = await tx.select().from(schema.shifts).where(eq(schema.shifts.id, id)).limit(1);
            if (!oldShift) throw new Error('Shift tidak ditemukan.');

            // 1. Soft-delete the shift
            const [updatedShift] = await tx.update(schema.shifts)
                .set({ isDeleted: true })
                .where(eq(schema.shifts.id, id))
                .returning();

            // 2. Cascading soft-delete: associated sales
            await tx.update(schema.sales)
                .set({ isDeleted: true })
                .where(eq(schema.sales.shiftId, id));

            // 3. Cascading soft-delete: associated expenses
            await tx.update(schema.expenses)
                .set({ isDeleted: true })
                .where(eq(schema.expenses.shiftId, id));

            if (updatedShift) {
                await tx.insert(schema.auditLogs).values({
                    userId: currentUserId,
                    action: `DELETE_CASHIER_SHIFT_CASCADE ID: ${id}`,
                    tableName: 'shifts',
                    oldData: JSON.stringify(oldShift),
                    createdAt: new Date()
                });
            }

            return updatedShift;
        });
    }
}
