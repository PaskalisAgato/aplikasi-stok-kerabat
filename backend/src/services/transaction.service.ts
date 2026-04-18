import { eq, sql, desc, and, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { CashierShiftService } from './cashierShift.service.js';

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
            notes: schema.saleItems.notes,
            recipeName: schema.recipes.name,
            category: schema.recipes.category,
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
            notes: schema.saleItems.notes,
            recipeName: schema.recipes.name,
            category: schema.recipes.category,
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
            notes: schema.saleItems.notes,
            recipeName: schema.recipes.name,
            recipePrice: schema.recipes.price,
            category: schema.recipes.category
        })
        .from(schema.saleItems)
        .innerJoin(schema.recipes, eq(schema.saleItems.recipeId, schema.recipes.id))
        .where(eq(schema.saleItems.saleId, id));

        return { ...sale, items };
    }

    // 3. PROCESS CHECKOUT (CREATE)
    static async processCheckout(data: any, userId: string) {
        const { id: offlineId, shiftId, items, subTotal, totalAmount, paymentMethod, paymentReferenceId, sourceId } = data;

        // 0. Idempotency Check (Offline ID)
        if (offlineId) {
            const existing = await db.select().from(schema.sales).where(eq(schema.sales.offlineId, offlineId)).limit(1);
            if (existing.length > 0) {
                console.log(`[Idempotency] Transaction ${offlineId} already exists. Returning cached success.`);
                return { success: true, transactionId: existing[0].id, alreadySynced: true };
            }
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Keranjang belanja kosong');
        }

        // 1. HARDENING: Re-validate prices from DB (Source of Truth)
        const recipeIds = items.map((i: any) => i.recipeId);
        const dbRecipes = await db.select({ id: schema.recipes.id, price: schema.recipes.price, costPrice: schema.recipes.costPrice })
            .from(schema.recipes)
            .where(inArray(schema.recipes.id, recipeIds));
        
        const priceMap = new Map(dbRecipes.map(r => [r.id, parseFloat(r.price)]));
        const costMap = new Map(dbRecipes.map(r => [r.id, parseFloat(r.costPrice)]));
        
        let serverCalculatedSubTotal = 0;
        for (const item of items) {
            const freshPrice = priceMap.get(item.recipeId);
            if (freshPrice === undefined) throw new Error(`Menu dengan ID ${item.recipeId} tidak ditemukan`);
            serverCalculatedSubTotal += freshPrice * item.quantity;
        }

        // 2. HARDENING: Compare with client total
        const clientTotal = parseFloat(totalAmount?.toString() || '0');
        // Tolerance for floating point if needed, but POS should be exact
        if (Math.abs(serverCalculatedSubTotal - clientTotal) > 0.01) {
            console.error(`[FRAUD ALERT] Price mismatch! Client: ${clientTotal}, Server: ${serverCalculatedSubTotal}`);
            
            // LOG CRITICAL FRAUD ALARM
            await db.insert(schema.auditLogs).values({
                userId,
                action: 'FRAUD_PRICE_MISMATCH_ATTEMPT',
                tableName: 'sales',
                oldData: JSON.stringify({ items, clientTotal }),
                newData: JSON.stringify({ serverCalculatedSubTotal, status: 'REJECTED_BY_SERVER_ARMOR' }),
                createdAt: new Date()
            });

            throw new Error('Manipulasi Harga Terdeteksi: Total harga tidak sesuai dengan database server.');
        }

        // 3. HARDENING: Active Shift Guard
        const activeShift = await CashierShiftService.getActiveShift(userId);
        if (!activeShift) {
            throw new Error('Shift belum dibuka. Tidak bisa melakukan transaksi.');
        }

        return await db.transaction(async (tx: any) => {
            let finalizedSaleId: number;
            let finalizedTotalAmount: string;

            const saleValues = {
                offlineId: offlineId || null,
                shiftId: activeShift.id,
                kasirId: userId,
                memberId: data.memberId || null,
                tableNumber: data.tableNumber || null,
                customerName: data.customerName || null,
                subTotal: serverCalculatedSubTotal.toString(),
                totalAmount: serverCalculatedSubTotal.toString(), // Using server calculated for security
                tax: data.tax?.toString() || '0',
                discount: data.discount?.toString() || '0',
                paymentMethod: data.paymentMethod || 'CASH',
                paymentReferenceId: data.paymentReferenceId || null,
                status: data.status || 'PAID',
                pointsUsed: data.pointsUsed || 0,
                createdAt: new Date()
            };

            if (sourceId) {
                // --- TRANSITION MODE: Transition OPEN Bill to PAID ---
                const [existingSale] = await tx.select().from(schema.sales).where(eq(schema.sales.id, sourceId)).limit(1);
                if (!existingSale) throw new Error('Bill asal tidak ditemukan');
                
                // 1. Revert Stock for Old Items
                const oldItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, sourceId));
                if (oldItems.length > 0) {
                    const oldRecipeIds = oldItems.map((i: any) => i.recipeId);
                    const oldBoms = await tx.select({
                        recipeId: schema.recipeIngredients.recipeId,
                        inventoryId: schema.recipeIngredients.inventoryId,
                        quantity: schema.recipeIngredients.quantity
                    }).from(schema.recipeIngredients).where(inArray(schema.recipeIngredients.recipeId, oldRecipeIds));

                    // Fetch inventory units for intelligent deduction (kg/l handling)
                    const oldInvIds = [...new Set(oldBoms.map((b: any) => b.inventoryId))] as number[];
                    let oldInvMap = new Map<number, string>();
                    if (oldInvIds.length > 0) {
                        const oldInvItems = await tx.select({ id: schema.inventory.id, unit: schema.inventory.unit }).from(schema.inventory).where(inArray(schema.inventory.id, oldInvIds));
                        oldInvMap = new Map(oldInvItems.map((i: any) => [i.id, i.unit]));
                    }

                    const revertMap = new Map<number, number>();
                    for (const item of oldItems) {
                        const boms = oldBoms.filter((b: any) => b.recipeId === item.recipeId);
                        for (const b of boms) {
                            const unit = oldInvMap.get(b.inventoryId);
                            if (!unit) continue;
                            let qty = parseFloat(b.quantity) * item.quantity;
                            if (['kg', 'l', 'liter', 'kilogram'].includes(unit.toLowerCase())) qty /= 1000;
                            revertMap.set(b.inventoryId, (revertMap.get(b.inventoryId) || 0) + qty);
                        }
                    }

                    for (const [invId, qty] of revertMap.entries()) {
                        await tx.update(schema.inventory)
                            .set({ currentStock: sql`${schema.inventory.currentStock} + ${qty}` })
                            .where(eq(schema.inventory.id, invId));
                        
                        await tx.insert(schema.stockMovements).values({
                            inventoryId: invId,
                            type: 'IN',
                            quantity: qty.toString(),
                            reason: `Revert for Bill Checkout #${sourceId}`
                        });
                    }

                    // 2. Clear Old Items
                    await tx.delete(schema.saleItems).where(eq(schema.saleItems.saleId, sourceId));
                }

                // 3. Update Sale Record
                const [updatedSale] = await tx.update(schema.sales).set({
                    ...saleValues,
                    id: undefined, // Don't overwrite ID
                    offlineId: offlineId || existingSale.offlineId,
                    createdAt: new Date(), // Reset time to payment time
                }).where(eq(schema.sales.id, sourceId)).returning();
                
                finalizedSaleId = updatedSale.id;
                finalizedTotalAmount = updatedSale.totalAmount;
            } else {
                // --- CREATE MODE: New Transaction ---
                const [newSale] = await tx.insert(schema.sales).values(saleValues).returning({
                    id: schema.sales.id,
                    totalAmount: schema.sales.totalAmount
                });
                finalizedSaleId = newSale.id;
                finalizedTotalAmount = newSale.totalAmount;
            }

            // 1. Bulk insert saleItems using server-verified prices
            const saleItemsInsertData = items.map((item: any) => {
                const verifiedPrice = priceMap.get(item.recipeId) || 0;
                const snapCostPrice = costMap.get(item.recipeId) || 0;
                return {
                    saleId: finalizedSaleId,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: (verifiedPrice * item.quantity).toString(),
                    notes: item.notes || null,
                    costPrice: snapCostPrice.toString()
                };
            });
            await tx.insert(schema.saleItems).values(saleItemsInsertData);

            // 2. Bulk fetch BOMs
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
                    reason: `POS Transaction #${finalizedSaleId}`
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
                newData: JSON.stringify({ saleId: finalizedSaleId, items }),
                createdAt: new Date()
            });

            // 6. Record to Cash Ledger (Anti-Fraud)
            if (data.paymentMethod === 'CASH' && (data.status === 'PAID' || saleValues.status === 'PAID')) {
                await tx.insert(schema.cashLedger).values({
                    shiftId: activeShift.id,
                    type: 'sale',
                    amount: finalizedTotalAmount.toString(),
                    referenceId: finalizedSaleId,
                    description: `Pemasukan Penjualan ${data.paymentMethod || 'CASH'}`
                });
            }

            // 7. Loyalty Points: Award & Redeem for Members
            if (saleValues.memberId && saleValues.status === 'PAID') {
                const { MemberService } = await import('./member.service.js');
                const pointsEarned = await MemberService.calcPointsEarned(serverCalculatedSubTotal);
                const pointsUsed = saleValues.pointsUsed || 0;

                // Update sale with earned points
                await tx.update(schema.sales)
                    .set({ pointsEarned })
                    .where(eq(schema.sales.id, finalizedSaleId));

                // Deduct used & add earned to member
                const delta = pointsEarned - pointsUsed;
                await tx.update(schema.members)
                    .set({ 
                        points: sql`GREATEST(0, ${schema.members.points} + ${delta})`,
                        level: sql`CASE 
                            WHEN (${schema.members.points} + ${delta}) >= 1000 THEN 'gold'
                            WHEN (${schema.members.points} + ${delta}) >= 300 THEN 'silver'
                            ELSE 'bronze' END`
                    })
                    .where(eq(schema.members.id, saleValues.memberId));
            }

            return { success: true, transactionId: finalizedSaleId, totalAmount: finalizedTotalAmount };
        });
    }

    // 3.1 ADD ITEMS TO EXISTING OPEN BILL
    static async addItemsToTransaction(saleId: number, items: any[], userId: string) {
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items to add');
        }

        // 0. Active Shift Guard
        const activeShift = await CashierShiftService.getActiveShift(userId);
        if (!activeShift) {
            throw new Error('Shift belum dibuka. Tidak bisa memodifikasi pesanan.');
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
                    subtotal: subtotal.toString(),
                    notes: item.notes || null
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
                    subtotal: (isNaN(itemSubtotalRaw) ? 0 : itemSubtotalRaw).toString(),
                    notes: item.notes || null
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

    static async voidTransaction(id: number, reason: string, userId: string, adminPin?: string) {
        const [sale] = await db.select().from(schema.sales).where(eq(schema.sales.id, id)).limit(1);
        if (!sale) throw new Error('Transaksi tidak ditemukan');
        if (sale.isVoided) throw new Error('Transaksi sudah dibatalkan sebelumnya');

        // 1. HARDENING: Anti-Fraud Void Rules
        const transactionAgeMinutes = (Date.now() - new Date(sale.createdAt).getTime()) / (1000 * 60);
        const requiresAdminApproval = transactionAgeMinutes > 2 || sale.paymentMethod === 'CASH';

        if (requiresAdminApproval) {
            if (!adminPin) {
                throw new Error('OTORISASI DIPERLUKAN: Pembatalan transaksi lama atau transaksi tunai wajib menggunakan PIN Admin.');
            }
            const isValidAdmin = await this.verifyAdminPin(adminPin);
            if (!isValidAdmin) {
                throw new Error('PIN Admin tidak valid. Gagal melakukan pembatalan.');
            }
        }

        // 2. HARDENING: Active Shift Guard
        const activeShift = await CashierShiftService.getActiveShift(userId);
        if (!activeShift) {
            throw new Error('Tidak bisa melakukan Void tanpa shift aktif.');
        }

        return await db.transaction(async (tx) => {
            const oldItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, id));

            // Mark as voided
            await tx.update(schema.sales)
                .set({ 
                    isVoided: true, 
                    voidReason: reason, 
                    voidedBy: userId, 
                    voidedAt: new Date() 
                })
                .where(eq(schema.sales.id, id));

            // Revert Stock
            await TransactionService.revertStockForSaleItems(tx, oldItems, id);

            // Negative Cash Ledger Record (Refund)
            if (sale.paymentMethod === 'CASH') {
                await tx.insert(schema.cashLedger).values({
                    shiftId: activeShift.id, // Use current active shift for the refund ledger entry
                    type: 'refund',
                    amount: (-parseFloat(sale.totalAmount)).toString(),
                    referenceId: sale.id,
                    description: `Pembatalan Transaksi (Void) - Alasan: ${reason}${adminPin ? ' (Approved by Admin)' : ''}`
                });
            }

            // Log to Void Logs
            await tx.insert(schema.voidLogs).values({
                transactionId: sale.id,
                userId: userId,
                reason: reason,
                approvedBy: adminPin ? 'ADMIN' : null, // Logical marker
            });

            // Audit Log
            await tx.insert(schema.auditLogs).values({
                userId,
                action: 'VOID_TRANSACTION_HARDENED',
                tableName: 'sales',
                oldData: JSON.stringify({ sale, items: oldItems }),
                newData: JSON.stringify({ isVoided: true, voidReason: reason, adminApproval: !!adminPin }),
                createdAt: new Date()
            });
        });
    }

    private static async verifyAdminPin(pin: string) {
        const admin = await db.select().from(schema.users)
            .where(and(eq(schema.users.pin, pin), eq(schema.users.role, 'Admin')))
            .limit(1);
        return admin.length > 0;
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

    // 7. MERGE TWO OR MORE BILLS (Gabung Meja Banyak)
    static async mergeBills(sourceIds: number[], targetId: number, userId: string) {
        if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
            throw new Error('ID bill sumber tidak valid');
        }

        // 0. Active Shift Guard
        const activeShift = await CashierShiftService.getActiveShift(userId);
        if (!activeShift) {
            throw new Error('Shift belum dibuka. Tidak bisa menggabungkan meja.');
        }

        return await db.transaction(async (tx: any) => {
            // 1. Fetch target bill
            const targetBillArr = await tx.select().from(schema.sales).where(and(eq(schema.sales.id, targetId), eq(schema.sales.status, 'OPEN'), eq(schema.sales.isDeleted, false))).limit(1);
            if (targetBillArr.length === 0) throw new Error('Bill tujuan tidak ditemukan atau sudah dibayar');
            const targetBill = targetBillArr[0];

            // 2. Fetch all source bills
            const sourceBills = await tx.select().from(schema.sales).where(
                and(
                    inArray(schema.sales.id, sourceIds),
                    eq(schema.sales.status, 'OPEN'),
                    eq(schema.sales.isDeleted, false)
                )
            );

            if (sourceBills.length === 0) throw new Error('Tidak ada bill sumber yang valid ditemukan');

            // 3. Move items from all sources to target
            await tx.update(schema.saleItems)
                .set({ saleId: targetId })
                .where(inArray(schema.saleItems.saleId, sourceIds));

            // 4. Recalculate totals for target bill
            const allItems = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, targetId));
            const newSubTotal = allItems.reduce((acc: number, item: any) => acc + parseFloat(item.subtotal), 0).toString();
            
            // 5. Update Target Bill Info
            const sourceInfos = sourceBills.map((b: any) => b.customerInfo).join(', ');
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
    static async splitBill(sourceId: number, targetInfo: string, itemsToMove: { saleItemId: number, quantity: number }[], userId: string) {
        console.log(`--- splitBill execution started ---`, { sourceId, targetInfo, itemsToMoveLength: itemsToMove.length });
        if (!itemsToMove || itemsToMove.length === 0) {
            throw new Error('Tidak ada item yang dipilih untuk dipisah');
        }

        // 0. Active Shift Guard
        const activeShift = await CashierShiftService.getActiveShift(userId);
        if (!activeShift) {
            throw new Error('Shift belum dibuka. Tidak bisa melakukan pisah meja.');
        }

        return await db.transaction(async (tx: any) => {
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
                } else {
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
                        subtotal: (moveQty * pricePerUnit).toString(),
                        notes: originalItem.notes
                    });
                }
            }

            // 4. Recalculate totals for both bills
            const recalculateBill = async (id: number) => {
                console.log(`Recalculating totals for bill ${id}...`);
                const items = await tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, id));
                const subTotal = items.reduce((acc: number, it: any) => acc + parseFloat(it.subtotal), 0).toString();
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
