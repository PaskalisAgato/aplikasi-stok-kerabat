import { Router, Request, Response } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

export const inventoryRouter = Router();

// GET all inventory items
inventoryRouter.get('/', async (req: Request, res: Response) => {
    try {
        const items = await db.select().from(schema.inventory);
        
        // Add dynamic status (NORMAL, KRITIS, HABIS) based on currentStock vs minStock
        const itemsWithStatus = items.map(item => {
            const current = parseFloat(item.currentStock);
            const min = parseFloat(item.minStock);
            let status = 'NORMAL';
            if (current <= 0) status = 'HABIS';
            else if (current <= min) status = 'KRITIS';

            return { ...item, status };
        });

        res.json(itemsWithStatus);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// GET Waste Summary
inventoryRouter.get('/waste/summary', async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Total Waste Value (Joining with Inventory for price)
        const wasteMovements = await db.select({
            id: schema.stockMovements.id,
            quantity: schema.stockMovements.quantity,
            pricePerUnit: schema.inventory.pricePerUnit,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(
            and(
                eq(schema.stockMovements.type, 'WASTE'),
                gte(schema.stockMovements.createdAt, thirtyDaysAgo)
            )
        );

        const totalWasteValue = wasteMovements.reduce((sum, m) => {
            return sum + (parseFloat(m.quantity) * parseFloat(m.pricePerUnit));
        }, 0);

        // 2. Top Waste Offenders
        const topOffenders = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            totalWasteValue: sql<number>`SUM(${schema.stockMovements.quantity} * ${schema.inventory.pricePerUnit})`
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(eq(schema.stockMovements.type, 'WASTE'))
        .groupBy(schema.inventory.id)
        .orderBy(sql`total_waste_value DESC`)
        .limit(5);

        res.json({
            totalValueMonth: totalWasteValue,
            topOffenders
        });
    } catch (error) {
        console.error('Error fetching waste summary:', error);
        res.status(500).json({ error: 'Failed to fetch waste summary' });
    }
});

// GET Item Specific Waste
inventoryRouter.get('/:id/waste', async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const wasteLogs = await db.select()
            .from(schema.stockMovements)
            .where(
                and(
                    eq(schema.stockMovements.inventoryId, inventoryId),
                    eq(schema.stockMovements.type, 'WASTE')
                )
            )
            .orderBy(schema.stockMovements.createdAt);

        res.json(wasteLogs);
    } catch (error) {
        console.error('Error fetching item waste logs:', error);
        res.status(500).json({ error: 'Failed to fetch item waste logs' });
    }
});

// POST new inventory item
inventoryRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { name, category, unit, minStock, pricePerUnit, discountPrice, imageUrl } = req.body;
        
        if (!name || !category || !unit) {
             return res.status(400).json({ error: 'Missing required fields' });
        }

        const [newItem] = await db.insert(schema.inventory).values({
            name,
            category,
            unit,
            currentStock: '0',
            minStock: minStock?.toString() || '0',
            pricePerUnit: pricePerUnit?.toString() || '0',
            discountPrice: discountPrice?.toString() || '0',
            imageUrl
        }).returning();

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

// PUT update inventory item master data
inventoryRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const { name, category, unit, minStock, imageUrl } = req.body;

        const [updatedItem] = await db.update(schema.inventory)
            .set({
                ...(name && { name }),
                ...(category && { category }),
                ...(unit && { unit }),
                ...(minStock !== undefined && { minStock: minStock.toString() }),
                ...(imageUrl !== undefined && { imageUrl })
            })
            .where(eq(schema.inventory.id, inventoryId))
            .returning();

        if (!updatedItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
});

// GET Item Specific Movements
inventoryRouter.get('/:id/movements', async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const movements = await db.select({
            id: schema.stockMovements.id,
            type: schema.stockMovements.type,
            quantity: schema.stockMovements.quantity,
            reason: schema.stockMovements.reason,
            supplierName: schema.suppliers.name,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .leftJoin(schema.suppliers, eq(schema.stockMovements.supplierId, schema.suppliers.id))
        .where(eq(schema.stockMovements.inventoryId, inventoryId))
        .orderBy(sql`${schema.stockMovements.createdAt} DESC`)
        .limit(20);

        res.json(movements);
    } catch (error) {
        console.error('Error fetching item movements:', error);
        res.status(500).json({ error: 'Failed to fetch movements' });
    }
});

// GET Recent Stock In (Restock History) - General
inventoryRouter.get('/movements/in', async (req: Request, res: Response) => {
    try {
        const history = await db.select({
            id: schema.stockMovements.id,
            inventoryName: schema.inventory.name,
            quantity: schema.stockMovements.quantity,
            unit: schema.inventory.unit,
            supplierName: schema.suppliers.name,
            reason: schema.stockMovements.reason,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .leftJoin(schema.suppliers, eq(schema.stockMovements.supplierId, schema.suppliers.id))
        .where(eq(schema.stockMovements.type, 'IN'))
        .orderBy(sql`${schema.stockMovements.createdAt} DESC`)
        .limit(50);

        res.json(history);
    } catch (error) {
        console.error('Error fetching stock in history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST Movement (In, Out, Waste, Adjust)
inventoryRouter.post('/:id/movement', async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const { type, quantity, reason, supplierId, supplierName, expiryDate, createdAt } = req.body;
        // type: 'IN', 'OUT', 'WASTE', 'OPNAME_ADJUSTMENT'

        if (!type || quantity === undefined || isNaN(Number(quantity))) {
             return res.status(400).json({ error: 'Missing or invalid type or quantity' });
        }

        const numericQty = parseFloat(quantity);
        // Determine sign based on type
        let multiplier = 1;
        if (type === 'OUT' || type === 'WASTE') {
            multiplier = -1;
        } else if (type === 'OPNAME_ADJUSTMENT') {
            multiplier = 1; 
        }

        const adjustment = numericQty * multiplier;

        console.log(`[Movement] ID: ${inventoryId}, Type: ${type}, Qty: ${quantity}, Adjustment: ${adjustment}`);

        await db.transaction(async (tx) => {
            let finalSupplierId = supplierId;
            
            // Auto-create supplier if name provided
            if (supplierName && !finalSupplierId) {
                const existingSupplier = await tx.select().from(schema.suppliers).where(eq(schema.suppliers.name, supplierName)).limit(1);
                if (existingSupplier.length > 0) {
                    finalSupplierId = existingSupplier[0].id;
                } else {
                    const [newSup] = await tx.insert(schema.suppliers).values({ name: supplierName }).returning({ id: schema.suppliers.id });
                    finalSupplierId = newSup.id;
                }
            }

            // 1. Insert Movement Record
            const expiry = expiryDate ? new Date(expiryDate) : null;
            const customDate = createdAt ? new Date(createdAt) : undefined;
            
            await tx.insert(schema.stockMovements).values({
                inventoryId,
                type,
                quantity: quantity.toString(),
                reason,
                supplierId: finalSupplierId,
                expiryDate: expiry,
                ...(customDate && { createdAt: customDate })
            });

            console.log(`[Movement] Updating stock for inventory ${inventoryId} by ${adjustment}`);

            // 2. Adjust Current Stock
            await tx.update(schema.inventory)
                .set({
                    currentStock: sql`${schema.inventory.currentStock} + ${adjustment}`
                })
                .where(eq(schema.inventory.id, inventoryId));
        });

        res.status(200).json({ success: true, message: 'Stock updated' });
    } catch (error) {
        console.error('Error recording movement:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to record stock movement' });
    }
});
