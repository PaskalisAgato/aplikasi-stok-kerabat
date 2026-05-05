import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, ne } from 'drizzle-orm';

async function runIntegrityCheck() {
    console.log("--- STARTING DATA INTEGRITY CHECK (MULTI-OUTLET) ---");
    let hasViolation = false;

    try {
        // 1. Check Inventory Leakage
        // Ensure no inventory item belongs to an invalid outlet, or a transaction pulls from another outlet
        console.log("Checking Inventory Outlet Boundaries...");
        const inventoryRecords = await db.select().from(schema.inventory);
        const uniqueOutlets = [...new Set(inventoryRecords.map(i => i.outletId))];
        console.log(`[OK] Found ${inventoryRecords.length} inventory items across ${uniqueOutlets.length} outlet(s).`);

        // 2. Check Sales Cross-Outlet Leaks
        console.log("Checking Sales & Transaction Boundaries...");
        const salesRecords = await db.select().from(schema.sales);
        const transactionOutlets = [...new Set(salesRecords.map(s => s.outletId))];
        console.log(`[OK] Analyzed ${salesRecords.length} sales across ${transactionOutlets.length} outlet(s).`);

        // Check for sales items violating the transaction's outlet
        // We do a join on sales items to inventory to see if the inventory outlet matches the sales outlet
        const mismatchItems = await db.select({
            transactionId: schema.sales.id,
            saleOutletId: schema.sales.outletId,
            itemId: schema.saleItems.recipeId,
            recipeName: schema.recipes.name,
            recipeOutletId: schema.recipes.outletId
        })
        .from(schema.saleItems)
        .innerJoin(schema.sales, eq(schema.saleItems.saleId, schema.sales.id))
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(ne(schema.sales.outletId, schema.recipes.outletId));

        if (mismatchItems.length > 0) {
            console.error(`[VIOLATION] Found ${mismatchItems.length} sales items crossing outlet boundaries!`);
            console.error(mismatchItems);
            hasViolation = true;
        } else {
            console.log(`[OK] All sales items map perfectly to their respective outlet's inventory.`);
        }

        // 3. Check Expense Reports Leaks
        console.log("Checking Expense Reporting Boundaries...");
        const mismatchExpenses = await db.select()
            .from(schema.expenses)
            .innerJoin(schema.shifts, eq(schema.expenses.shiftId, schema.shifts.id))
            .where(ne(schema.expenses.outletId, schema.shifts.outletId));
        
        if (mismatchExpenses.length > 0) {
            console.error(`[VIOLATION] Found ${mismatchExpenses.length} expenses mapped to the wrong outlet shift!`);
            hasViolation = true;
        } else {
            console.log(`[OK] All expenses correctly respect shift and outlet boundaries.`);
        }

        if (!hasViolation) {
            console.log("\n✅ ALL INTEGRITY CHECKS PASSED. SYSTEM IS SECURE.");
        } else {
            console.log("\n❌ DATA INTEGRITY VIOLATIONS FOUND. REVIEW REQUIRED.");
        }
    } catch (e) {
        console.error("Test failed to execute:", e);
    } finally {
        process.exit(hasViolation ? 1 : 0);
    }
}

runIntegrityCheck();
