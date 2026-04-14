
import { db } from './src/config/db.js';
import * as schema from './src/db/schema.js';
import { eq, and, sql, ne } from 'drizzle-orm';

async function diagnose() {
    console.log('--- SHIFT DIAGNOSTIC START ---');
    
    // 1. Get current active shift(s)
    const activeShifts = await db.select().from(schema.shifts).where(eq(schema.shifts.status, 'OPEN'));
    console.log(`Found ${activeShifts.length} active shifts.`);
    
    for (const shift of activeShifts) {
        console.log(`\nChecking Shift ID: ${shift.id} (User: ${shift.userId})`);
        
        // 2. Check Sales for this shift
        const sales = await db.select().from(schema.sales).where(eq(schema.sales.shiftId, shift.id));
        console.log(`- Sales in table: ${sales.length}`);
        const omzet = sales.filter(s => !s.isVoided && !s.isDeleted).reduce((acc, s) => acc + parseFloat(s.totalAmount), 0);
        console.log(`- Total Omzet (non-deleted/voided): ${omzet}`);
        
        const openSales = sales.filter(s => s.status === 'OPEN').length;
        console.log(`- Open Bills: ${openSales}`);
        
        const deletedSales = sales.filter(s => s.isDeleted).length;
        console.log(`- Deleted Sales: ${deletedSales}`);

        // 3. Check Ledger for this shift
        const ledger = await db.select().from(schema.cashLedger).where(eq(schema.cashLedger.shiftId, shift.id));
        console.log(`- Ledger entries: ${ledger.length}`);
        const ledgerSales = ledger.filter(l => l.type === 'sale').reduce((acc, l) => acc + parseFloat(l.amount), 0);
        console.log(`- Ledger Total Sales: ${ledgerSales}`);
        
        // 4. Check for orphaned ledger entries or sales without ledger
        const salesIds = sales.map(s => s.id);
        const ledgerSaleRefs = ledger.filter(l => l.type === 'sale' && l.referenceId).filter(l => l.referenceId !== null).map(l => l.referenceId as number);
        
        const salesWithoutLedger = sales.filter(s => s.status === 'PAID' && !ledgerSaleRefs.includes(s.id));
        console.log(`- PAID Sales without Ledger entry: ${salesWithoutLedger.length}`);
        
        if (salesWithoutLedger.length > 0) {
            console.log('Sample missing IDs:', salesWithoutLedger.slice(0, 5).map(s => s.id));
        }

        // 5. Check User linkage for History
        const salesWithUsers = await db.select({ id: schema.sales.id })
            .from(schema.sales)
            .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
            .where(eq(schema.sales.shiftId, shift.id));
        console.log(`- Sales appearing in History (joined with users): ${salesWithUsers.length}`);
    }
    
    console.log('\n--- DIAGNOSTIC COMPLETE ---');
    process.exit(0);
}

diagnose().catch(console.error);
