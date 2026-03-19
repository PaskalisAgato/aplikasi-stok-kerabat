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
exports.salesRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
exports.salesRouter = (0, express_1.Router)();
// POST Checkout Cart
exports.salesRouter.post('/', async (req, res) => {
    try {
        const { shiftId, items, subTotal, taxAmount, serviceChargeAmount, totalAmount, paymentMethod } = req.body;
        // Mock userId if auth not attached. Better Auth usually injects req.user
        const userId = req.user?.id || 'emp_1';
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        const parsedShiftId = shiftId ? parseInt(shiftId) : 1; // Assuming a dummy shift_1 if none provided for now
        await db_1.db.transaction(async (tx) => {
            // 1. Record Sale
            const [newSale] = await tx.insert(schema.sales).values({
                shiftId: parsedShiftId,
                userId,
                subTotal: subTotal.toString(),
                taxAmount: (taxAmount || 0).toString(),
                serviceChargeAmount: (serviceChargeAmount || 0).toString(),
                totalAmount: totalAmount.toString(),
                paymentMethod: paymentMethod || 'CASH'
            }).returning();
            // 2. Record Sale Items
            for (const item of items) {
                await tx.insert(schema.saleItems).values({
                    saleId: newSale.id,
                    recipeId: item.recipeId,
                    quantity: item.quantity,
                    subtotal: item.subtotal.toString()
                });
                // 3. BOM Automation: Deduct Stock
                const recipeIngs = await tx.select().from(schema.recipeIngredients).where((0, drizzle_orm_1.eq)(schema.recipeIngredients.recipeId, item.recipeId));
                for (const bom of recipeIngs) {
                    const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                    const invItem = invItemArr[0];
                    if (!invItem)
                        continue;
                    let baseDeductQty = parseFloat(bom.quantity) * item.quantity;
                    // Auto-convert grams to Kg or mL to L for master stock
                    const unitLower = invItem.unit.toLowerCase();
                    if (unitLower === 'kg' || unitLower === 'l' || unitLower === 'liter' || unitLower === 'kilogram') {
                        baseDeductQty = baseDeductQty / 1000;
                    }
                    // Insert Movement Log
                    await tx.insert(schema.stockMovements).values({
                        inventoryId: bom.inventoryId,
                        type: 'OUT',
                        quantity: baseDeductQty.toString(), // Log the master unit amount deducted
                        reason: `POS Sale #${newSale.id}`
                    });
                    // Update Master Stock
                    await tx.update(schema.inventory)
                        .set({
                        currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} - ${baseDeductQty}`
                    })
                        .where((0, drizzle_orm_1.eq)(schema.inventory.id, bom.inventoryId));
                }
            }
        });
        res.status(201).json({ success: true, message: 'Checkout completed successfully' });
    }
    catch (error) {
        console.error('Error during checkout transaction:', error);
        res.status(500).json({ error: 'POS Transaction Failed' });
    }
});
