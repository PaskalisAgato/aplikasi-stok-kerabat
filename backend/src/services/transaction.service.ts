import { eq, sql, desc, and, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';

export class TransactionService {

    // 1. GET ALL TRANSACTIONS WITH PAGINATION
    static async getAllTransactions(limit = 20, offset = 0) {
        const _sales = await db.select({
            id: schema.sales.id,
            totalAmount: schema.sales.totalAmount,
            paymentMethod: schema.sales.paymentMethod,
            createdAt: schema.sales.createdAt,
            cashierName: schema.users.name,
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(eq(schema.sales.isDeleted, false))
        .orderBy(desc(schema.sales.createdAt))
        .limit(limit)
        .offset(offset);

        // Fetch all items to attach to sales (Excluding recipeImage for speed)
        const saleIds = _sales.map(s => s.id);
        if (saleIds.length === 0) return [];

        const _items = await db.select({
            id: schema.saleItems.id,
            saleId: schema.saleItems.saleId,
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity,
            subtotal: schema.saleItems.subtotal,
            recipeName: schema.recipes.name,
            // recipeImage is intentionally excluded in list view
            externalRecipeImage: schema.recipes.externalImageUrl
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(inArray(schema.saleItems.saleId, saleIds));

        return _sales.map((sale: any) => ({
            ...sale,
            items: _items.filter((i: any) => i.saleId === sale.id)
        }));
    }

    // 1.1 GET OPEN BILLS
    static async getOpenBills() {
        const _bills = await db.select({
            id: schema.sales.id,
            totalAmount: schema.sales.totalAmount,
            customerInfo: schema.sales.customerInfo,
            createdAt: schema.sales.createdAt,
            cashierName: schema.users.name,
        })
        .from(schema.sales)
        .innerJoin(schema.users, eq(schema.sales.userId, schema.users.id))
        .where(and(eq(schema.sales.status, 'OPEN'), eq(schema.sales.isDeleted, false)))
        .orderBy(desc(schema.sales.createdAt));

        const billIds = _bills.map(b => b.id);
        if (billIds.length === 0) return [];

        const _items = await db.select({
            id: schema.saleItems.id,
            saleId: schema.saleItems.saleId,
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity,
            subtotal: schema.saleItems.subtotal,
            recipeName: schema.recipes.name,
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(inArray(schema.saleItems.saleId, billIds));

        return _bills.map((bill: any) => ({
            ...bill,
            items: _items.filter((i: any) => i.saleId === bill.id)
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
        .where(
            and(
                eq(schema.sales.id, id),
                eq(schema.sales.isDeleted, false)
            )
        )
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
        const { id: offlineId, shiftId, items, subTotal, totalAmount, paymentMethod } = data;

        // 0. Idempotency Check (Offline ID)
        if (offlineId) {
            const existing = await db.select().from(schema.sales).where(eq(schema.sales.offlineId, offlineId)).limit(1);
            if (existing.length > 0) {
                console.log(`[Idempotency] Transaction ${offlineId} already exists. Skipping.`);
                return { success: true, transactionId: existing[0].id, alreadySynced: true };
            }
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items in cart');
        }

        let calculatedSubTotal = subTotal ? parseFloat(subTotal.toString()) : 0;
        if (isNaN(calculatedSubTotal)) calculatedSubTotal = 0;

        // 0.5 Duplicate Open Bill Check
        const status = data.status || 'PAID';
        const customerInfo = data.customerInfo;
        if (status === 'OPEN' && customerInfo) {
            const existingOpen = await db.select({ id: schema.sales.id })
                .from(schema.sales)
                .where(
                    and(
                        eq(schema.sales.status, 'OPEN'),
                        eq(schema.sales.customerInfo, customerInfo),
                        eq(schema.sales.isDeleted, false)
                    )
                )
                .limit(1);
            
            if (existingOpen.length > 0) {
                throw new Error(`Tagihan untuk "${customerInfo}" sudah aktif. Gunakan fitur "Tambah Item" untuk memperbarui pesanan.`);
            }
        }

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
            offlineId: offlineId || null,
            shiftId: !isNaN(parsedShiftId) ? parsedShiftId : sql`NULL`,
            userId,
            subTotal: calculatedSubTotal.toString(),
            taxAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: finalTotalAmount.toString(),
            paymentMethod: paymentMethod || 'CASH',
            status: data.status || 'PAID',
            customerInfo: data.customerInfo || null
        };

        return await db.transaction(async (tx: any) => {
            const [newSale] = await tx.insert(schema.sales).values(saleValues).returning({
                id: schema.sales.id,
                totalAmount: schema.sales.totalAmount
            });

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
            const allBomDeps = await tx.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                quantity: schema.recipeIngredients.quantity
            }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            
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

    // 3.1 ADD ITEMS TO EXISTING OPEN BILL
    static async addItemsToTransaction(saleId: number, items: any[], userId: string) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items to add');
        }

        return await db.transaction(async (tx: any) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(and(eq(schema.sales.id, saleId), eq(schema.sales.status, 'OPEN'))).limit(1);
            if (oldSaleArr.length === 0) throw new Error('Open transaction not found or already paid');
            const oldSale = oldSaleArr[0];

            // 1. Insert new items and calculate incremental totals
            let incrementalSubtotal = 0;
            const saleItemsInsertData = items.map((item: any) => {
                const itemPriceRaw = parseFloat(item.price?.toString() || '0');
                const itemPrice = isNaN(itemPriceRaw) ? 0 : itemPriceRaw;
                const itemSubtotalRaw = item.subtotal ? parseFloat(item.subtotal.toString()) : (itemPrice * (item.quantity || 0));
                const subtotal = isNaN(itemSubtotalRaw) ? 0 : itemSubtotalRaw;
                incrementalSubtotal += subtotal;
                return {
                    saleId: saleId,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: subtotal.toString()
                };
            });
            await tx.insert(schema.saleItems).values(saleItemsInsertData);

            // 2. Update parent sale totals
            const newSubTotal = (parseFloat(oldSale.subTotal) + incrementalSubtotal).toString();
            const newTotalAmount = (parseFloat(oldSale.totalAmount) + incrementalSubtotal).toString();
            
            await tx.update(schema.sales).set({
                subTotal: newSubTotal,
                totalAmount: newTotalAmount,
            }).where(eq(schema.sales.id, saleId));

            // 3. Deduct stock for NEW items
            const recipeIds = items.map((i: any) => i.recipeId);
            const allBomDeps = await tx.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                quantity: schema.recipeIngredients.quantity
            }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            
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
                    reason: `Bill Addition #${saleId}`
                }));
                await tx.insert(schema.stockMovements).values(movementsData);

                const updatePromises = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => 
                    tx.update(schema.inventory)
                        .set({ currentStock: sql`${schema.inventory.currentStock} - ${qty}` })
                        .where(eq(schema.inventory.id, invId))
                );
                await Promise.all(updatePromises);
            }

            // 4. Log to Audit
            await tx.insert(schema.auditLogs).values({
                userId,
                action: 'ADD_ITEMS_TO_BILL',
                tableName: 'sales',
                oldData: JSON.stringify(oldSale),
                newData: JSON.stringify({ saleId, addedItems: items }),
                createdAt: new Date()
            });

            return { success: true, updatedTotal: newTotalAmount };
        });
    }

    // Helper: Revert stock for items
    private static async revertStockForSaleItems(tx: any, items: any[], saleId: number) {
        if (!items || items.length === 0) return;

        const recipeIds = items.map((i: any) => i.recipeId);
        const allBomDeps = await tx.select({
            recipeId: schema.recipeIngredients.recipeId,
            inventoryId: schema.recipeIngredients.inventoryId,
            quantity: schema.recipeIngredients.quantity
        }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
        
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
        return await db.transaction(async (tx: any) => {
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
            }).where(eq(schema.sales.id, saleId)).returning({
                id: schema.sales.id,
                totalAmount: schema.sales.totalAmount
            });

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
            const allBomDeps = await tx.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                quantity: schema.recipeIngredients.quantity
            }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            
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
        return await db.transaction(async (tx: any) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0) throw new Error('Transaction not found');
            const oldSale = oldSaleArr[0];

            const oldItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, saleId));

            // SOFT DELETE TRANSACTION
            await tx.update(schema.sales)
                .set({ isDeleted: true })
                .where(eq(schema.sales.id, saleId));

            // Log Audit
            await tx.insert(schema.auditLogs).values({
                userId: adminId,
                action: 'SOFT_DELETE_TRANSACTION',
                tableName: 'sales',
                oldData: JSON.stringify({ sale: oldSale, items: oldItems }),
                newData: { isDeleted: true },
                createdAt: new Date()
            });

        });
    }

    // 6. CLEAR ALL TRANSACTIONS
    static async clearAllTransactions(adminId: string) {
        return await db.transaction(async (tx: any) => {
            // SOFT DELETE ALL SALES
            await tx.update(schema.sales)
                .set({ isDeleted: true })
                .where(eq(schema.sales.isDeleted, false));

            // Log Audit
            await tx.insert(schema.auditLogs).values({
                userId: adminId,
                action: 'CLEAR_ALL_TRANSACTIONS',
                tableName: 'sales',
                oldData: 'BATCH_CLEAR',
                newData: JSON.stringify({ isDeleted: true }),
                createdAt: new Date()
            });

            return { success: true };
        });
    }
}
