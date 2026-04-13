import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

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
        .where(eq(schema.cashLedger.shiftId, shiftId))
        .groupBy(schema.cashLedger.type);

        const summary = { sale: 0, expense: 0, refund: 0, handover: 0 };
        for (const row of results) {
            summary[row.type as keyof typeof summary] = parseFloat(row.total || '0');
        }
        return summary;
    }
}
