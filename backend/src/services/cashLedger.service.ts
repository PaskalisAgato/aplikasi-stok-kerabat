import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, sql, and, or, isNull, ne } from 'drizzle-orm';

export interface CashLedgerEntry {
    shiftId: number;
    type: 'sale' | 'refund' | 'expense' | 'handover';
    amount: number;
    referenceId?: number;
    description?: string;
}

export class CashLedgerService {
    static async addEntry(entry: CashLedgerEntry) {
        console.log(`[CASH LEDGER] Recording ${entry.type} of ${entry.amount} to shift ${entry.shiftId}`);
        const [inserted] = await db.insert(schema.cashLedger).values({
            shiftId: entry.shiftId,
            type: entry.type,
            amount: entry.amount.toString(),
            referenceId: entry.referenceId,
            description: entry.description
        }).returning();
        return inserted;
    }

    static async getSummary(shiftId: number) {
        const results = await db.select({
            type: schema.cashLedger.type,
            total: sql<string>`sum(cast(${schema.cashLedger.amount} as decimal))`
        })
        .from(schema.cashLedger)
        .leftJoin(schema.sales, eq(schema.cashLedger.referenceId, schema.sales.id))
        .leftJoin(schema.expenses, eq(schema.cashLedger.referenceId, schema.expenses.id))
        .where(and(
            eq(schema.cashLedger.shiftId, shiftId),
            // Filter: Ignore if its a sale/refund/expense that has been deleted
            or(
                // 1. It's not a sale or expense (e.g. adjustment, handover)
                and(
                    ne(schema.cashLedger.type, 'sale'),
                    ne(schema.cashLedger.type, 'refund'),
                    ne(schema.cashLedger.type, 'expense')
                ),
                // 2. It's a sale that is NOT deleted AND NOT voided
                and(
                    eq(schema.cashLedger.type, 'sale'),
                    eq(schema.sales.isDeleted, false),
                    eq(schema.sales.isVoided, false)
                ),
                // 3. It's an expense that is NOT deleted
                and(
                    eq(schema.cashLedger.type, 'expense'),
                    eq(schema.expenses.isDeleted, false)
                ),
                // 4. Default safetynet if no reference found at all
                and(
                    isNull(schema.sales.id),
                    isNull(schema.expenses.id)
                )
            )
        ))
        .groupBy(schema.cashLedger.type);

        const summary = { sale: 0, expense: 0, refund: 0, handover: 0 };
        for (const row of results) {
            summary[row.type as keyof typeof summary] = parseFloat(row.total || '0');
        }
        return summary;
    }
}
