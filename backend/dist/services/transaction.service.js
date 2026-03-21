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
    static async processCheckout(data, userId) {
        const { shiftId, items, subTotal, totalAmount, paymentMethod } = data;
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items in cart');
        }
        // Calculate subtotal from items if not provided
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
        // Build the sale record
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
                // Auto-deduct inventory based on recipe BOM
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
                        .set({
                        currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} - ${baseDeductQty}`
                    })
                        .where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                }
            }
            return { success: true, transactionId: newSale.id };
        });
    }
}
exports.TransactionService = TransactionService;
