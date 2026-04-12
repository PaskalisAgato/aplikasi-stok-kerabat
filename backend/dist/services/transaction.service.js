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
        if (saleIds.length === 0)
            return [];
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
        return _sales.map((sale) => ({
            ...sale,
            items: _items.filter((i) => i.saleId === sale.id)
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
        if (billIds.length === 0)
            return [];
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
        return _bills.map((bill) => ({
            ...bill,
            items: _items.filter((i) => i.saleId === bill.id)
        }));
    }
    // 2. GET TRANSACTION BY ID
    static async getTransactionById(id) {
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
            .where(and(eq(schema.sales.id, id), eq(schema.sales.isDeleted, false)))
            .limit(1);
        if (saleArr.length === 0)
            return null;
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
    static async processCheckout(data, userId) {
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
        if (isNaN(calculatedSubTotal))
            calculatedSubTotal = 0;
        // 0.5 Duplicate Open Bill Check
        const status = data.status || 'PAID';
        const customerInfo = data.customerInfo;
        if (status === 'OPEN' && customerInfo) {
            const existingOpen = await db.select({ id: schema.sales.id })
                .from(schema.sales)
                .where(and(eq(schema.sales.status, 'OPEN'), eq(schema.sales.customerInfo, customerInfo), eq(schema.sales.isDeleted, false)))
                .limit(1);
            if (existingOpen.length > 0) {
                throw new Error(`Tagihan untuk "${customerInfo}" sudah aktif. Gunakan fitur "Tambah Item" untuk memperbarui pesanan.`);
            }
        }
        if (calculatedSubTotal === 0) {
            calculatedSubTotal = items.reduce((acc, item) => {
                const p = parseFloat(item.price?.toString() || '0');
                return acc + (isNaN(p) ? 0 : p * (item.quantity || 0));
            }, 0);
        }
        let finalTotalAmount = totalAmount ? parseFloat(totalAmount.toString()) : calculatedSubTotal;
        if (isNaN(finalTotalAmount))
            finalTotalAmount = calculatedSubTotal;
        const parsedShiftId = (shiftId !== null && shiftId !== undefined && shiftId !== '')
            ? parseInt(shiftId.toString())
            : NaN;
        const saleValues = {
            offlineId: offlineId || null,
            shiftId: !isNaN(parsedShiftId) ? parsedShiftId : sql `NULL`,
            userId,
            subTotal: calculatedSubTotal.toString(),
            taxAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: finalTotalAmount.toString(),
            paymentMethod: paymentMethod || 'CASH',
            status: data.status || 'PAID',
            customerInfo: data.customerInfo || null
        };
        return await db.transaction(async (tx) => {
            const [newSale] = await tx.insert(schema.sales).values(saleValues).returning({
                id: schema.sales.id,
                totalAmount: schema.sales.totalAmount
            });
            // 1. Bulk insert saleItems
            const saleItemsInsertData = items.map((item) => {
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
            const recipeIds = items.map((i) => i.recipeId);
            const allBomDeps = await tx.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                quantity: schema.recipeIngredients.quantity
            }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            // 3. Bulk fetch Inventory 
            const invIds = [...new Set(allBomDeps.map((b) => b.inventoryId))];
            let invMap = new Map();
            if (invIds.length > 0) {
                const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invMap = new Map(invItems.map((i) => [i.id, i.unit]));
            }
            // 4. Aggregate stock deductions
            const inventoryDeductions = new Map();
            for (const item of items) {
                const bomDeps = allBomDeps.filter((b) => b.recipeId === item.recipeId);
                for (const bom of bomDeps) {
                    const unit = invMap.get(bom.inventoryId);
                    if (!unit)
                        continue;
                    let deductQty = parseFloat(bom.quantity) * item.quantity;
                    if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase()))
                        deductQty /= 1000;
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
                const updatePromises = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => tx.update(schema.inventory)
                    .set({ currentStock: sql `${schema.inventory.currentStock} - ${qty}` })
                    .where(eq(schema.inventory.id, invId)));
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
    static async addItemsToTransaction(saleId, items, userId) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items to add');
        }
        return await db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(and(eq(schema.sales.id, saleId), eq(schema.sales.status, 'OPEN'))).limit(1);
            if (oldSaleArr.length === 0)
                throw new Error('Open transaction not found or already paid');
            const oldSale = oldSaleArr[0];
            // 1. Insert new items and calculate incremental totals
            let incrementalSubtotal = 0;
            const saleItemsInsertData = items.map((item) => {
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
            const recipeIds = items.map((i) => i.recipeId);
            const allBomDeps = await tx.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                quantity: schema.recipeIngredients.quantity
            }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            const invIds = [...new Set(allBomDeps.map((b) => b.inventoryId))];
            let invMap = new Map();
            if (invIds.length > 0) {
                const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invMap = new Map(invItems.map((i) => [i.id, i.unit]));
            }
            const inventoryDeductions = new Map();
            for (const item of items) {
                const bomDeps = allBomDeps.filter((b) => b.recipeId === item.recipeId);
                for (const bom of bomDeps) {
                    const unit = invMap.get(bom.inventoryId);
                    if (!unit)
                        continue;
                    let deductQty = parseFloat(bom.quantity) * item.quantity;
                    if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase()))
                        deductQty /= 1000;
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
                const updatePromises = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => tx.update(schema.inventory)
                    .set({ currentStock: sql `${schema.inventory.currentStock} - ${qty}` })
                    .where(eq(schema.inventory.id, invId)));
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
    static async revertStockForSaleItems(tx, items, saleId) {
        if (!items || items.length === 0)
            return;
        const recipeIds = items.map((i) => i.recipeId);
        const allBomDeps = await tx.select({
            recipeId: schema.recipeIngredients.recipeId,
            inventoryId: schema.recipeIngredients.inventoryId,
            quantity: schema.recipeIngredients.quantity
        }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
        const invIds = [...new Set(allBomDeps.map((b) => b.inventoryId))];
        if (invIds.length === 0)
            return;
        const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
        const invMap = new Map(invItems.map((i) => [i.id, i.unit]));
        const inventoryReversions = new Map();
        for (const item of items) {
            const bomDeps = allBomDeps.filter((b) => b.recipeId === item.recipeId);
            for (const bom of bomDeps) {
                const unit = invMap.get(bom.inventoryId);
                if (!unit)
                    continue;
                let revertQty = parseFloat(bom.quantity) * item.quantity;
                if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase()))
                    revertQty /= 1000;
                inventoryReversions.set(bom.inventoryId, (inventoryReversions.get(bom.inventoryId) || 0) + revertQty);
            }
        }
        if (inventoryReversions.size > 0) {
            const delPromises = Array.from(inventoryReversions.keys()).map(invId => tx.delete(schema.stockMovements).where(and(eq(schema.stockMovements.inventoryId, invId), eq(schema.stockMovements.reason, `POS Transaction #${saleId}`))));
            await Promise.all(delPromises);
            const updatePromises = Array.from(inventoryReversions.entries()).map(([invId, qty]) => tx.update(schema.inventory)
                .set({ currentStock: sql `${schema.inventory.currentStock} + ${qty}` })
                .where(eq(schema.inventory.id, invId)));
            await Promise.all(updatePromises);
        }
    }
    // 4. UPDATE TRANSACTION
    static async updateTransaction(saleId, data, adminId) {
        return await db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0)
                throw new Error('Transaction not found');
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
                calculatedSubTotal = items.reduce((acc, item) => acc + (parseFloat(item.price?.toString() || '0') * (item.quantity || 0)), 0);
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
            const saleItemsInsertData = items.map((item) => {
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
            const recipeIds = items.map((i) => i.recipeId);
            const allBomDeps = await tx.select({
                recipeId: schema.recipeIngredients.recipeId,
                inventoryId: schema.recipeIngredients.inventoryId,
                quantity: schema.recipeIngredients.quantity
            }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            const invIds = [...new Set(allBomDeps.map((b) => b.inventoryId))];
            let invMap = new Map();
            if (invIds.length > 0) {
                const invItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invMap = new Map(invItems.map((i) => [i.id, i.unit]));
            }
            const inventoryDeductions = new Map();
            for (const item of items) {
                const bomDeps = allBomDeps.filter((b) => b.recipeId === item.recipeId);
                for (const bom of bomDeps) {
                    const unit = invMap.get(bom.inventoryId);
                    if (!unit)
                        continue;
                    let deductQty = parseFloat(bom.quantity) * item.quantity;
                    if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase()))
                        deductQty /= 1000;
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
                const updatePromises = Array.from(inventoryDeductions.entries()).map(([invId, qty]) => tx.update(schema.inventory)
                    .set({ currentStock: sql `${schema.inventory.currentStock} - ${qty}` })
                    .where(eq(schema.inventory.id, invId)));
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
    static async deleteTransaction(saleId, adminId) {
        return await db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where(eq(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0)
                throw new Error('Transaction not found');
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
    static async clearAllTransactions(adminId) {
        return await db.transaction(async (tx) => {
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
    // 7. MERGE TWO OR MORE BILLS (Gabung Meja Banyak)
    static async mergeBills(sourceIds, targetId, userId) {
        if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
            throw new Error('ID bill sumber tidak valid');
        }
        return await db.transaction(async (tx) => {
            // 1. Fetch target bill
            const targetBillArr = await tx.select().from(schema.sales).where(and(eq(schema.sales.id, targetId), eq(schema.sales.status, 'OPEN'), eq(schema.sales.isDeleted, false))).limit(1);
            if (targetBillArr.length === 0)
                throw new Error('Bill tujuan tidak ditemukan atau sudah dibayar');
            const targetBill = targetBillArr[0];
            // 2. Fetch all source bills
            const sourceBills = await tx.select().from(schema.sales).where(and(inArray(schema.sales.id, sourceIds), eq(schema.sales.status, 'OPEN'), eq(schema.sales.isDeleted, false)));
            if (sourceBills.length === 0)
                throw new Error('Tidak ada bill sumber yang valid ditemukan');
            // 3. Move items from all sources to target
            await tx.update(schema.saleItems)
                .set({ saleId: targetId })
                .where(inArray(schema.saleItems.saleId, sourceIds));
            // 4. Recalculate totals for target bill
            const allItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, targetId));
            const newSubTotal = allItems.reduce((acc, item) => acc + parseFloat(item.subtotal), 0).toString();
            // 5. Update Target Bill Info
            const sourceInfos = sourceBills.map((b) => b.customerInfo).join(', ');
            const combinedInfo = `${targetBill.customerInfo}, ${sourceInfos}`;
            await tx.update(schema.sales)
                .set({
                subTotal: newSubTotal,
                totalAmount: newSubTotal,
                customerInfo: combinedInfo,
            })
                .where(eq(schema.sales.id, targetId));
            // 6. Soft Delete All Source Bills
            await tx.update(schema.sales)
                .set({ isDeleted: true })
                .where(inArray(schema.sales.id, sourceIds));
            // 7. Log Audit
            await tx.insert(schema.auditLogs).values({
                userId,
                action: 'MERGE_BILLS_MULTI',
                tableName: 'sales',
                oldData: JSON.stringify({ sourceIds, targetId, targetInfo: targetBill.customerInfo }),
                newData: JSON.stringify({ mergedId: targetId, newTotal: newSubTotal, newInfo: combinedInfo }),
                createdAt: new Date()
            });
            return { success: true, targetId, newTotal: newSubTotal, newInfo: combinedInfo };
        });
    }
    // 8. SPLIT BILL (Pisah Meja)
    static async splitBill(sourceId, targetInfo, itemsToMove, userId) {
        console.log(`--- splitBill execution started ---`, { sourceId, targetInfo, itemsToMoveLength: itemsToMove.length });
        if (!itemsToMove || itemsToMove.length === 0) {
            throw new Error('Tidak ada item yang dipilih untuk dipisah');
        }
        return await db.transaction(async (tx) => {
            // 1. Fetch source bill
            const sourceBillArr = await tx.select().from(schema.sales).where(and(eq(schema.sales.id, sourceId), eq(schema.sales.status, 'OPEN'), eq(schema.sales.isDeleted, false))).limit(1);
            if (sourceBillArr.length === 0) {
                console.error(`Source bill ${sourceId} not found or already paid`);
                throw new Error('Bill sumber tidak ditemukan atau sudah dibayar');
            }
            const sourceBill = sourceBillArr[0];
            // 2. Create New Target Bill
            console.log(`Creating new target bill with customerInfo: ${targetInfo || sourceBill.customerInfo + ' (Split)'}`);
            const [newBill] = await tx.insert(schema.sales).values({
                userId: sourceBill.userId,
                customerInfo: targetInfo || `${sourceBill.customerInfo} (Split)`,
                status: 'OPEN',
                subTotal: '0',
                totalAmount: '0',
                paymentMethod: sourceBill.paymentMethod || 'CASH',
                isDeleted: false,
                createdAt: new Date()
            }).returning({ id: schema.sales.id });
            const targetId = newBill.id;
            console.log(`New bill created with ID: ${targetId}`);
            // 3. Move/Split Items
            for (const item of itemsToMove) {
                console.log(`Processing item split: ${JSON.stringify(item)}`);
                const originalItemArr = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.id, item.saleItemId)).limit(1);
                if (originalItemArr.length === 0) {
                    console.warn(`Item ${item.saleItemId} not found, skipping`);
                    continue;
                }
                const originalItem = originalItemArr[0];
                const moveQty = parseInt(item.quantity.toString());
                const originalQty = parseInt(originalItem.quantity.toString());
                console.log(`Item stats: moveQty=${moveQty}, originalQty=${originalQty}`);
                if (moveQty >= originalQty) {
                    console.log(`Moving full item ${originalItem.id} to new bill`);
                    // Move the entire item entry
                    await tx.update(schema.saleItems)
                        .set({ saleId: targetId })
                        .where(eq(schema.saleItems.id, item.saleItemId));
                }
                else {
                    console.log(`Splitting item ${originalItem.id} (moved ${moveQty}, remaining ${originalQty - moveQty})`);
                    // Split the item entry
                    // Since price isn't in saleItems, we need to calculate it from subtotal/quantity of the original item
                    const pricePerUnit = parseFloat(originalItem.subtotal) / originalQty;
                    // Update original
                    const remainingQty = originalQty - moveQty;
                    await tx.update(schema.saleItems)
                        .set({
                        quantity: remainingQty,
                        subtotal: (remainingQty * pricePerUnit).toString()
                    })
                        .where(eq(schema.saleItems.id, item.saleItemId));
                    // Create new in target
                    await tx.insert(schema.saleItems).values({
                        saleId: targetId,
                        recipeId: originalItem.recipeId,
                        quantity: moveQty,
                        subtotal: (moveQty * pricePerUnit).toString()
                    });
                }
            }
            // 4. Recalculate totals for both bills
            const recalculateBill = async (id) => {
                console.log(`Recalculating totals for bill ${id}...`);
                const items = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, id));
                const subTotal = items.reduce((acc, it) => acc + parseFloat(it.subtotal), 0).toString();
                await tx.update(schema.sales)
                    .set({ subTotal, totalAmount: subTotal })
                    .where(eq(schema.sales.id, id));
                console.log(`Bill ${id} new total: ${subTotal}`);
                return subTotal;
            };
            const sourceTotal = await recalculateBill(sourceId);
            const targetTotal = await recalculateBill(targetId);
            // 5. Log Audit
            await tx.insert(schema.auditLogs).values({
                userId,
                action: 'SPLIT_BILL',
                tableName: 'sales',
                oldData: JSON.stringify({ sourceId, itemsMoved: itemsToMove }),
                newData: JSON.stringify({ sourceId, sourceNewTotal: sourceTotal, targetId, targetTotal }),
                createdAt: new Date()
            });
            console.log(`--- splitBill execution success ---`);
            return { success: true, sourceId, sourceTotal, targetId, targetTotal };
        });
    }
}
