"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema = __importStar(require("../db/schema"));
class TransactionService {
    // 1. GET ALL TRANSACTIONS
    static async getAllTransactions() {
        const _sales = await db_1.db.select({
            id: schema.sales.id,
            totalAmount: schema.sales.totalAmount,
            paymentMethod: schema.sales.paymentMethod,
            createdAt: schema.sales.createdAt,
            cashierName: schema.users.name,
        })
            .from(schema.sales)
            .innerJoin(schema.users, (0, drizzle_orm_1.eq)(schema.sales.userId, schema.users.id))
            .orderBy((0, drizzle_orm_1.desc)(schema.sales.createdAt));
        // Fetch all items to attach to sales
        const _items = await db_1.db.select({
            id: schema.saleItems.id,
            saleId: schema.saleItems.saleId,
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity,
            subtotal: schema.saleItems.subtotal,
            recipeName: schema.recipes.name,
            recipeImage: schema.recipes.imageUrl
        })
            .from(schema.saleItems)
            .innerJoin(schema.recipes, (0, drizzle_orm_1.eq)(schema.saleItems.recipeId, schema.recipes.id));
        return _sales.map(sale => ({
            ...sale,
            items: _items.filter(i => i.saleId === sale.id)
        }));
    }
    // 2. GET TRANSACTION BY ID
    static async getTransactionById(id) {
        const saleArr = await db_1.db.select({
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
            .innerJoin(schema.users, (0, drizzle_orm_1.eq)(schema.sales.userId, schema.users.id))
            .where((0, drizzle_orm_1.eq)(schema.sales.id, id))
            .limit(1);
        if (saleArr.length === 0)
            return null;
        const sale = saleArr[0];
        const items = await db_1.db.select({
            id: schema.saleItems.id,
            recipeId: schema.saleItems.recipeId,
            quantity: schema.saleItems.quantity,
            subtotal: schema.saleItems.subtotal,
            recipeName: schema.recipes.name,
            recipePrice: schema.recipes.price
        })
            .from(schema.saleItems)
            .innerJoin(schema.recipes, (0, drizzle_orm_1.eq)(schema.saleItems.recipeId, schema.recipes.id))
            .where((0, drizzle_orm_1.eq)(schema.saleItems.saleId, id));
        return { ...sale, items };
    }
    // 3. PROCESS CHECKOUT (CREATE)
    static async processCheckout(data, userId) {
        const { shiftId, items, subTotal, totalAmount, paymentMethod } = data;
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items in cart');
        }
        let calculatedSubTotal = subTotal ? parseFloat(subTotal.toString()) : 0;
        if (isNaN(calculatedSubTotal))
            calculatedSubTotal = 0;
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
            shiftId: !isNaN(parsedShiftId) ? parsedShiftId : (0, drizzle_orm_1.sql) `NULL`,
            userId,
            subTotal: calculatedSubTotal.toString(),
            taxAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: finalTotalAmount.toString(),
            paymentMethod: paymentMethod || 'CASH'
        };
        return await db_1.db.transaction(async (tx) => {
            const [newSale] = await tx.insert(schema.sales).values(saleValues).returning();
            for (const item of items) {
                const itemPriceRaw = parseFloat(item.price?.toString() || '0');
                const itemPrice = isNaN(itemPriceRaw) ? 0 : itemPriceRaw;
                const itemSubtotalRaw = item.subtotal ? parseFloat(item.subtotal.toString()) : (itemPrice * (item.quantity || 0));
                const itemSubtotal = isNaN(itemSubtotalRaw) ? 0 : itemSubtotalRaw;
                await tx.insert(schema.saleItems).values({
                    saleId: newSale.id,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: itemSubtotal.toString()
                });
                // Auto-deduct inventory
                const recipeIngs = await tx.select().from(schema.recipeIngredients).where((0, drizzle_orm_1.eq)(schema.recipeIngredients.recipeId, item.recipeId));
                for (const bom of recipeIngs) {
                    const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                    const invItem = invItemArr[0];
                    if (!invItem)
                        continue;
                    let baseDeductQty = parseFloat(bom.quantity) * item.quantity;
                    const unitLower = invItem.unit.toLowerCase();
                    if (['kg', 'l', 'liter', 'kilogram'].includes(unitLower)) {
                        baseDeductQty = baseDeductQty / 1000;
                    }
                    await tx.insert(schema.stockMovements).values({
                        inventoryId: bom.inventoryId,
                        type: 'OUT',
                        quantity: baseDeductQty.toString(),
                        reason: `POS Transaction #${newSale.id}`
                    });
                    await tx.update(schema.inventory)
                        .set({ currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} - ${baseDeductQty}` })
                        .where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                }
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
    static async revertStockForSaleItems(tx, items, saleId) {
        for (const item of items) {
            const recipeIngs = await tx.select().from(schema.recipeIngredients).where((0, drizzle_orm_1.eq)(schema.recipeIngredients.recipeId, item.recipeId));
            for (const bom of recipeIngs) {
                const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                const invItem = invItemArr[0];
                if (!invItem)
                    continue;
                let baseRevertQty = parseFloat(bom.quantity) * item.quantity;
                const unitLower = invItem.unit.toLowerCase();
                if (['kg', 'l', 'liter', 'kilogram'].includes(unitLower)) {
                    baseRevertQty = baseRevertQty / 1000;
                }
                // Remove old stock movements related to this sale
                await tx.delete(schema.stockMovements).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.stockMovements.inventoryId, bom.inventoryId), (0, drizzle_orm_1.eq)(schema.stockMovements.reason, `POS Transaction #${saleId}`)));
                // Add stock back
                await tx.update(schema.inventory)
                    .set({ currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} + ${baseRevertQty}` })
                    .where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
            }
        }
    }
    // 4. UPDATE TRANSACTION
    static async updateTransaction(saleId, data, adminId) {
        return await db_1.db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where((0, drizzle_orm_1.eq)(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0)
                throw new Error('Transaction not found');
            const oldSale = oldSaleArr[0];
            const oldItems = await tx.select().from(schema.saleItems).where((0, drizzle_orm_1.eq)(schema.saleItems.saleId, saleId));
            // Revert old stock based on old items
            await TransactionService.revertStockForSaleItems(tx, oldItems, saleId);
            // Delete old items
            await tx.delete(schema.saleItems).where((0, drizzle_orm_1.eq)(schema.saleItems.saleId, saleId));
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
            }).where((0, drizzle_orm_1.eq)(schema.sales.id, saleId)).returning();
            for (const item of items) {
                const itemPriceRaw = parseFloat(item.price?.toString() || '0');
                const itemPrice = isNaN(itemPriceRaw) ? 0 : itemPriceRaw;
                const itemSubtotalRaw = item.subtotal ? parseFloat(item.subtotal.toString()) : (itemPrice * (item.quantity || 0));
                await tx.insert(schema.saleItems).values({
                    saleId: saleId,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: itemSubtotalRaw.toString()
                });
                // Deduct new inventory
                const recipeIngs = await tx.select().from(schema.recipeIngredients).where((0, drizzle_orm_1.eq)(schema.recipeIngredients.recipeId, item.recipeId));
                for (const bom of recipeIngs) {
                    const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                    const invItem = invItemArr[0];
                    if (!invItem)
                        continue;
                    let baseDeductQty = parseFloat(bom.quantity) * item.quantity;
                    if (['kg', 'l', 'liter', 'kilogram'].includes(invItem.unit.toLowerCase())) {
                        baseDeductQty = baseDeductQty / 1000;
                    }
                    await tx.insert(schema.stockMovements).values({
                        inventoryId: bom.inventoryId,
                        type: 'OUT',
                        quantity: baseDeductQty.toString(),
                        reason: `POS Transaction #${saleId}`
                    });
                    await tx.update(schema.inventory)
                        .set({ currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} - ${baseDeductQty}` })
                        .where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                }
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
        return await db_1.db.transaction(async (tx) => {
            const oldSaleArr = await tx.select().from(schema.sales).where((0, drizzle_orm_1.eq)(schema.sales.id, saleId)).limit(1);
            if (oldSaleArr.length === 0)
                throw new Error('Transaction not found');
            const oldSale = oldSaleArr[0];
            const oldItems = await tx.select().from(schema.saleItems).where((0, drizzle_orm_1.eq)(schema.saleItems.saleId, saleId));
            // Revert stock
            await TransactionService.revertStockForSaleItems(tx, oldItems, saleId);
            // Delete items
            await tx.delete(schema.saleItems).where((0, drizzle_orm_1.eq)(schema.saleItems.saleId, saleId));
            // Delete sale
            await tx.delete(schema.sales).where((0, drizzle_orm_1.eq)(schema.sales.id, saleId));
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
exports.TransactionService = TransactionService;
