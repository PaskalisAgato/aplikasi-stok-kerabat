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
exports.inventoryRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
exports.inventoryRouter = (0, express_1.Router)();
// GET all inventory items
exports.inventoryRouter.get('/', async (req, res) => {
    try {
        const items = await db_1.db.select().from(schema.inventory);
        // Add dynamic status (NORMAL, KRITIS, HABIS) based on currentStock vs minStock
        const itemsWithStatus = items.map(item => {
            const current = parseFloat(item.currentStock);
            const min = parseFloat(item.minStock);
            let status = 'NORMAL';
            if (current <= 0)
                status = 'HABIS';
            else if (current <= min)
                status = 'KRITIS';
            return { ...item, status };
        });
        res.json(itemsWithStatus);
    }
    catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});
// GET Waste Summary
exports.inventoryRouter.get('/waste/summary', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // 1. Total Waste Value (Joining with Inventory for price)
        const wasteMovements = await db_1.db.select({
            id: schema.stockMovements.id,
            quantity: schema.stockMovements.quantity,
            pricePerUnit: schema.inventory.pricePerUnit,
            createdAt: schema.stockMovements.createdAt
        })
            .from(schema.stockMovements)
            .innerJoin(schema.inventory, (0, drizzle_orm_1.eq)(schema.stockMovements.inventoryId, schema.inventory.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.stockMovements.type, 'WASTE'), (0, drizzle_orm_1.gte)(schema.stockMovements.createdAt, thirtyDaysAgo)));
        const totalWasteValue = wasteMovements.reduce((sum, m) => {
            return sum + (parseFloat(m.quantity) * parseFloat(m.pricePerUnit));
        }, 0);
        // 2. Top Waste Offenders
        const topOffenders = await db_1.db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            totalWasteValue: (0, drizzle_orm_1.sql) `SUM(${schema.stockMovements.quantity} * ${schema.inventory.pricePerUnit})`
        })
            .from(schema.stockMovements)
            .innerJoin(schema.inventory, (0, drizzle_orm_1.eq)(schema.stockMovements.inventoryId, schema.inventory.id))
            .where((0, drizzle_orm_1.eq)(schema.stockMovements.type, 'WASTE'))
            .groupBy(schema.inventory.id)
            .orderBy((0, drizzle_orm_1.sql) `total_waste_value DESC`)
            .limit(5);
        res.json({
            totalValueMonth: totalWasteValue,
            topOffenders
        });
    }
    catch (error) {
        console.error('Error fetching waste summary:', error);
        res.status(500).json({ error: 'Failed to fetch waste summary' });
    }
});
// GET Item Specific Waste
exports.inventoryRouter.get('/:id/waste', async (req, res) => {
    try {
        const inventoryId = parseInt(req.params.id);
        const wasteLogs = await db_1.db.select()
            .from(schema.stockMovements)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.stockMovements.inventoryId, inventoryId), (0, drizzle_orm_1.eq)(schema.stockMovements.type, 'WASTE')))
            .orderBy(schema.stockMovements.createdAt);
        res.json(wasteLogs);
    }
    catch (error) {
        console.error('Error fetching item waste logs:', error);
        res.status(500).json({ error: 'Failed to fetch item waste logs' });
    }
});
// POST new inventory item
exports.inventoryRouter.post('/', async (req, res) => {
    try {
        const { name, category, unit, minStock, pricePerUnit, imageUrl } = req.body;
        if (!name || !category || !unit) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const [newItem] = await db_1.db.insert(schema.inventory).values({
            name,
            category,
            unit,
            currentStock: '0',
            minStock: minStock?.toString() || '0',
            pricePerUnit: pricePerUnit?.toString() || '0',
            imageUrl
        }).returning();
        res.status(201).json(newItem);
    }
    catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});
// POST Movement (In, Out, Waste, Adjust)
exports.inventoryRouter.post('/:id/movement', async (req, res) => {
    try {
        const inventoryId = parseInt(req.params.id);
        const { type, quantity, reason, supplierId, expiryDate } = req.body;
        // type: 'IN', 'OUT', 'WASTE', 'OPNAME_ADJUSTMENT'
        if (!type || quantity === undefined || isNaN(Number(quantity))) {
            return res.status(400).json({ error: 'Missing or invalid type or quantity' });
        }
        const numericQty = parseFloat(quantity);
        // Determine sign based on type
        let multiplier = 1;
        if (type === 'OUT' || type === 'WASTE') {
            multiplier = -1;
        }
        else if (type === 'OPNAME_ADJUSTMENT') {
            multiplier = 1;
        }
        const adjustment = numericQty * multiplier;
        console.log(`[Movement] ID: ${inventoryId}, Type: ${type}, Qty: ${quantity}, Adjustment: ${adjustment}`);
        await db_1.db.transaction(async (tx) => {
            // 1. Insert Movement Record
            const expiry = expiryDate ? new Date(expiryDate) : null;
            await tx.insert(schema.stockMovements).values({
                inventoryId,
                type,
                quantity: quantity.toString(),
                reason,
                supplierId,
                expiryDate: expiry
            });
            console.log(`[Movement] Updating stock for inventory ${inventoryId} by ${adjustment}`);
            // 2. Adjust Current Stock
            await tx.update(schema.inventory)
                .set({
                currentStock: (0, drizzle_orm_1.sql) `${schema.inventory.currentStock} + ${adjustment}`
            })
                .where((0, drizzle_orm_1.eq)(schema.inventory.id, inventoryId));
        });
        res.status(200).json({ success: true, message: 'Stock updated' });
    }
    catch (error) {
        console.error('Error recording movement:', error);
        res.status(500).json({ error: error.message || 'Failed to record stock movement' });
    }
});
