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
exports.transactionsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
exports.transactionsRouter = (0, express_1.Router)();
// POST Checkout Cart (Process Transaction)
exports.transactionsRouter.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { shiftId, items, subTotal, totalAmount, paymentMethod } = req.body;
        const userId = req.user?.id || 'anonymous';
        console.log(`[TRANSACTION] User ID: ${userId}, items count: ${items?.length}, shiftId: ${shiftId}`);
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        let calculatedSubTotal = subTotal ? parseFloat(subTotal.toString()) : 0;
        if (isNaN(calculatedSubTotal))
            calculatedSubTotal = 0;
        if (calculatedSubTotal === 0 && items) {
            calculatedSubTotal = items.reduce((acc, item) => {
                const p = parseFloat(item.price?.toString() || '0');
                return acc + (isNaN(p) ? 0 : p * (item.quantity || 0));
            }, 0);
        }
        let finalTotalAmount = totalAmount ? parseFloat(totalAmount.toString()) : calculatedSubTotal;
        if (isNaN(finalTotalAmount))
            finalTotalAmount = calculatedSubTotal;
        await db_1.db.transaction(async (tx) => {
            // 1. Record Transaction
            const [newTransaction] = await tx.insert(schema.transactions).values({
                shiftId: shiftId ? parseInt(shiftId.toString()) : null,
                userId,
                subTotal: calculatedSubTotal.toString(),
                taxAmount: '0',
                serviceChargeAmount: '0',
                totalAmount: finalTotalAmount.toString(),
                paymentMethod: paymentMethod || 'CASH'
            }).returning();
            // 2. Record Transaction Items
            for (const item of items) {
                const itemPriceRaw = parseFloat(item.price?.toString() || '0');
                const itemPrice = isNaN(itemPriceRaw) ? 0 : itemPriceRaw;
                const itemSubtotalRaw = item.subtotal ? parseFloat(item.subtotal.toString()) : (itemPrice * (item.quantity || 0));
                const itemSubtotal = isNaN(itemSubtotalRaw) ? 0 : itemSubtotalRaw;
                await tx.insert(schema.transactionItems).values({
                    transactionId: newTransaction.id,
                    productId: item.productId || item.recipeId, // Handle both names for migration
                    quantity: item.quantity,
                    subtotal: itemSubtotal.toString()
                });
                // 3. BOM Automation: Deduct Stock
                const productIngs = await tx.select().from(schema.productIngredients).where((0, drizzle_orm_1.eq)(schema.productIngredients.productId, item.productId || item.recipeId));
                for (const bom of productIngs) {
                    const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                    const invItem = invItemArr[0];
                    if (!invItem)
                        continue;
                    let baseDeductQty = parseFloat(bom.quantity) * item.quantity;
                    const unitLower = invItem.unit.toLowerCase();
                    if (unitLower === 'kg' || unitLower === 'l' || unitLower === 'liter' || unitLower === 'kilogram') {
                        baseDeductQty = baseDeductQty / 1000;
                    }
                    await tx.insert(schema.stockMovements).values({
                        inventoryId: bom.inventoryId,
                        type: 'OUT',
                        quantity: baseDeductQty.toString(),
                        reason: `Transaction #${newTransaction.id}`
                    });
                    await tx.update(schema.inventory)
                        .set({
                        currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} - ${baseDeductQty}`
                    })
                        .where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                }
            }
        });
        res.status(201).json({ success: true, message: 'Transaction completed successfully' });
    }
    catch (error) {
        console.error('--- TRANSACTION FATAL ERROR ---');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Transaction Failed', detail: error.message });
    }
});
