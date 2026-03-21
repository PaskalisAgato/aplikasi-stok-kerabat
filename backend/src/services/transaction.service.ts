import { eq, sql, desc, and, inArray } from 'drizzle-orm';
import { db } from '../config/db';
import * as schema from '../db/schema';

export class TransactionService {

    // 1. GET ALL TRANSACTIONS
    static async getAllTransactions() {
        const _sales = await db.select({
            id: schema.sales.id,
            totalAmount: schema.sales.totalAmount,
            paymentMethod: schema.sales.paymentMethod,
            createdAt: schema.sales.createdAt,
            cashierName: schema.users.name,
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .orderBy(desc(schema.sales.createdAt));

        // Fetch all items to attach to sales
        const _items = await db.select({
            id: schema.saleItems.id,
            saleId: schema.saleItems.saleId,
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity,
            subtotal: schema.saleItems.subtotal,
            recipeName: schema.recipes.name,
            recipeImage: schema.recipes.imageUrl
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id));

        return _sales.map(sale => ({
            ...sale,
            items: _items.filter(i => i.saleId === sale.id)
        }));
    }

    // 2. GET TRANSACTION BY ID
    static async getTransactionById(id: number) {
        const saleArr = await db.select({
            id: schema.sales.id,
            totalAmount: schema.sales.totalAmount,
            paymentMethod: schema.sales.paymentMethod,
            subTotal: schema.sales.subTotal,
            taxAmount: schema.sales.taxAmount,
            serviceChargeAmount: schema.sales.serviceChargeAmount,
            createdAt: schema.sales.createdAt,
            userId: schema.sales.userId,
            cashierName: schema.users.name,
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(eq(schema.sales.id, id))
        .limit(1);

        if (saleArr.length === 0) return null;
        const sale = saleArr[0];

        const items = await db.select({
            id: schema.saleItems.id,
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity,
            subtotal: schema.saleItems.subtotal,
            recipeName: schema.recipes.name,
            recipePrice: schema.recipes.price
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(eq(schema.saleItems.saleId, id));

        return { ...sale, items };
    }

    // 3. PROCESS CHECKOUT (CREATE)
    static async processCheckout(data: any, userId: string) {
        const { shiftId, items, subTotal, totalAmount, paymentMethod } = data;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items in cart');
        }

        let calculatedSubTotal = subTotal ? parseFloat(subTotal.toString()) : 0;
        if (isNaN(calculatedSubTotal)) calculatedSubTotal = 0;

        if (calculatedSubTotal === 0) {
            calculatedSubTotal = items.reduce((acc: number, item: any) => {
                const p = parseFloat(item.price?.toString() || '0');
                return acc + (isNaN(p) ? 0 : p * (item.quantity || 0));
            }, 0);
        }

        let finalTotalAmount = totalAmount ? parseFloat(totalAmount.toString()) : calculatedSubTotal;
        if (isNaN(finalTotalAmount)) finalTotalAmount = calculatedSubTotal;

        const parsedShiftId = (shiftId !== null && shiftId !== undefined && shiftId !== '')
            ? parseInt(shiftId.toString())
            : NaN;

        const saleValues: any = {
            shiftId: !isNaN(parsedShiftId) ? parsedShiftId : sql`NULL`,
            userId,
            subTotal: calculatedSubTotal.toString(),
            taxAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: finalTotalAmount.toString(),
            paymentMethod: paymentMethod || 'CASH'
        };

        return await db.transaction(async (tx) => {
            const [newSale] = await tx.insert(schema.sales).values(saleValues).returning();

            // 1. Bulk insert saleItems
            const saleItemsInsertData = items.map((item: any) => {
                const itemPriceRaw = parseFloat(item.price?.toString() || '0');
                const itemPrice = isNaN(itemPriceRaw) ? 0 : itemPriceRaw;
                const itemSubtotalRaw = item.subtotal ? parseFloat(item.subtotal.toString()) : (itemPrice * (item.quantity || 0));
                return {
                    saleId: newSale.id,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: (isNaN(itemSubtotalRaw) ? 0 : itemSubtotalRaw).toString()
                };
            });
            await tx.insert(schema.saleItems).values(saleItemsInsertData);

            // 2. Bulk fetch BOMs
            const recipeIds = items.map((i: any) => i.recipeId);
            const allBomDeps = await tx.select().from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            
            // 3. Bulk fetch Inventory 
            const invIds = [...new Set(allBomDeps.map((b: any) => b.inventoryId))] as number[];
            let invMap = new Map<number, string>();
            if (invIds.length > 0) {
                const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invMap = new Map(invItems.map((i: any) => [i.id, i.unit]));
            }

            // 4. Aggregate stock deductions
            const inventoryDeductions = new Map<number, number>();
            for (const item of items) {
                const bomDeps = allBomDeps.filter((b: any) => b.recipeId === item.recipeId);
                for (const bom of bomDeps) {
                    const unit = invMap.get(bom.inventoryId) as string;
                    if (!unit) continue;
                    let deductQty = parseFloat(bom.quantity) * item.quantity;
                    if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase())) deductQty /= 1000;
                    
                    inventoryDeductions.set(bom.inventoryId, (inventoryDeductions.get(bom.inventoryId) || 0) + deductQty);
                }
            }

            // 5. Bulk update & Stock movements
            if (inventoryDeductions.size > 0) {
                const movementsData = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => ({
                    inventoryId: invId,
                    type: 'OUT',
                    quantity: qty.toString(),
                    reason: `POS Transaction #${newSale.id}`
                }));
                await tx.insert(schema.stockMovements).values(movementsData);

                const updatePromises = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => 
                    tx.update(schema.inventory)
                        .set({ currentStock: sql`${schema.inventory.currentStock} - ${qty}` })
                        .where(eq(schema.inventory.id, invId))
                );
                await Promise.all(updatePromises);
            }
            
            // Log to Audit
            await tx.insert(schema.auditLogs).values({
                userId,
                action: 'CREATE_TRANSACTION',
                tableName: 'sales',
                oldData: null,
                newData: JSON.stringify({ sale: newSale, items }),
                createdAt: new Date()
            });

            return { success: true, transactionId: newSale.id };
        });
    }

    // Helper: Revert stock for items
    private static async revertStockForSaleItems(tx: any, items: any[], saleId: number) {
        if (!items || items.length === 0) return;

        const recipeIds = items.map((i: any) => i.recipeId);
        const allBomDeps = await tx.select().from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
        
        const invIds = [...new Set(allBomDeps.map((b: any) => b.inventoryId))] as number[];
        if (invIds.length === 0) return;

        const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
        const invMap = new Map(invItems.map((i: any) => [i.id, i.unit]));

        const inventoryReversions = new Map<number, number>();
        for (const item of items) {
            const bomDeps = allBomDeps.filter((b: any) => b.recipeId === item.recipeId);
            for (const bom of bomDeps) {
                const unit = invMap.get(bom.inventoryId) as string;
                if (!unit) continue;
                let revertQty = parseFloat(bom.quantity) * item.quantity;
                if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase())) revertQty /= 1000;
                
                inventoryReversions.set(bom.inventoryId, (inventoryReversions.get(bom.inventoryId) || 0) + revertQty);
            }
        }

        if (inventoryReversions.size > 0) {
            const delPromises = Array.from(inventoryReversions.keys()).map(invId => 
                tx.delete(schema.stockMovements).where(
                    and(
                        eq(schema.stockMovements.inventoryId, invId),
                        eq(schema.stockMovements.reason, `POS Transaction #${saleId}`)
                    )
                )
            );
            await Promise.all(delPromises);

            const updatePromises = Array.from(inventoryReversions.entries()).map(([invId, qty]) => 
                tx.update(schema.inventory)
                    .set({ currentStock: sql`${schema.inventory.currentStock} + ${qty}` })
                    .where(eq(schema.inventory.id, invId))
            );
            await Promise.all(updatePromises);
        }
    }

    // 4. UPDATE TRANSACTION
    static async updateTransaction(saleId: number, data: any, adminId: string) {
        return await db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0) throw new Error('Transaction not found');
            const oldSale = oldSaleArr[0];

            const oldItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, saleId));

            // Revert old stock based on old items
            await TransactionService.revertStockForSaleItems(tx, oldItems, saleId);
            
            // Delete old items
            await tx.delete(schema.saleItems).where(eq(schema.saleItems.saleId, saleId));

            // Process new data
            const { items, subTotal, totalAmount, paymentMethod } = data;
            
            let calculatedSubTotal = parseFloat(subTotal?.toString() || '0');
            if (isNaN(calculatedSubTotal) || calculatedSubTotal === 0) {
               calculatedSubTotal = items.reduce((acc: number, item: any) => acc + (parseFloat(item.price?.toString() || '0') * (item.quantity || 0)), 0);
            }
            let finalTotalAmount = parseFloat(totalAmount?.toString() || calculatedSubTotal.toString());
            
            const [updatedSale] = await tx.update(schema.sales).set({
                subTotal: calculatedSubTotal.toString(),
                totalAmount: finalTotalAmount.toString(),
                paymentMethod: paymentMethod || oldSale.paymentMethod
            }).where(eq(schema.sales.id, saleId)).returning();

            const saleItemsInsertData = items.map((item: any) => {
                const itemPriceRaw = parseFloat(item.price?.toString() || '0');
                const itemPrice = isNaN(itemPriceRaw) ? 0 : itemPriceRaw;
                const itemSubtotalRaw = item.subtotal ? parseFloat(item.subtotal.toString()) : (itemPrice * (item.quantity || 0));
                return {
                    saleId: saleId,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: (isNaN(itemSubtotalRaw) ? 0 : itemSubtotalRaw).toString()
                };
            });
            await tx.insert(schema.saleItems).values(saleItemsInsertData);

            // Deduct new inventory (batched)
            const recipeIds = items.map((i: any) => i.recipeId);
            const allBomDeps = await tx.select().from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            
            const invIds = [...new Set(allBomDeps.map((b: any) => b.inventoryId))] as number[];
            let invMap = new Map<number, string>();
            if (invIds.length > 0) {
                const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invMap = new Map(invItems.map((i: any) => [i.id, i.unit]));
            }

            const inventoryDeductions = new Map<number, number>();
            for (const item of items) {
                const bomDeps = allBomDeps.filter((b: any) => b.recipeId === item.recipeId);
                for (const bom of bomDeps) {
                    const unit = invMap.get(bom.inventoryId) as string;
                    if (!unit) continue;
                    let deductQty = parseFloat(bom.quantity) * item.quantity;
                    if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase())) deductQty /= 1000;
                    inventoryDeductions.set(bom.inventoryId, (inventoryDeductions.get(bom.inventoryId) || 0) + deductQty);
                }
            }

            if (inventoryDeductions.size > 0) {
                const movementsData = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => ({
                    inventoryId: invId,
                    type: 'OUT',
                    quantity: qty.toString(),
                    reason: `POS Transaction #${saleId}`
                }));
                await tx.insert(schema.stockMovements).values(movementsData);

                const updatePromises = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => 
                    tx.update(schema.inventory)
                        .set({ currentStock: sql`${schema.inventory.currentStock} - ${qty}` })
                        .where(eq(schema.inventory.id, invId))
                );
                await Promise.all(updatePromises);
            }

            // Log Audit
            await tx.insert(schema.auditLogs).values({
                userId: adminId,
                action: 'UPDATE_TRANSACTION',
                tableName: 'sales',
                oldData: JSON.stringify({ sale: oldSale, items: oldItems }),
                newData: JSON.stringify({ sale: updatedSale, items }),
                createdAt: new Date()
            });

            return { success: true };
        });
    }

    // 5. DELETE TRANSACTION
    static async deleteTransaction(saleId: number, adminId: string) {
        return await db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0) throw new Error('Transaction not found');
            const oldSale = oldSaleArr[0];

            const oldItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, saleId));

            // Revert stock
            await TransactionService.revertStockForSaleItems(tx, oldItems, saleId);
            
            // Delete items
            await tx.delete(schema.saleItems).where(eq(schema.saleItems.saleId, saleId));

            // Delete sale
            await tx.delete(schema.sales).where(eq(schema.sales.id, saleId));

            // Log Audit
            await tx.insert(schema.auditLogs).values({
                userId: adminId,
                action: 'DELETE_TRANSACTION',
                tableName: 'sales',
                oldData: JSON.stringify({ sale: oldSale, items: oldItems }),
                newData: null,
                createdAt: new Date()
            });

            return { success: true };
        });
    }
}
