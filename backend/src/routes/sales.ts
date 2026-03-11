import { Router, Request, Response } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '../index'; 

export const salesRouter = Router();

// POST Checkout Cart
salesRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { shiftId, items, subTotal, taxAmount, serviceChargeAmount, totalAmount, paymentMethod } = req.body;
        // Mock userId if auth not attached. Better Auth usually injects req.user
        const userId = (req as any).user?.id || 'emp_1'; 
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }
        
        const parsedShiftId = shiftId ? parseInt(shiftId) : 1; // Assuming a dummy shift_1 if none provided for now

        await db.transaction(async (tx) => {
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
                const recipeIngs = await tx.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, item.recipeId));
                
                for (const bom of recipeIngs) {
                    const deductQty = parseFloat(bom.quantity) * item.quantity;
                    
                    // Insert Movement Log
                    await tx.insert(schema.stockMovements).values({
                        inventoryId: bom.inventoryId,
                        type: 'OUT',
                        quantity: deductQty.toString(),
                        reason: `POS Sale #${newSale.id}`
                    });

                    // Update Master Stock
                    await tx.update(schema.inventory)
                        .set({
                            currentStock: sql`${schema.inventory.currentStock} - ${deductQty}`
                        })
                        .where(eq(schema.inventory.id, bom.inventoryId));
                }
            }
        });

        res.status(201).json({ success: true, message: 'Checkout completed successfully' });
    } catch (error) {
        console.error('Error during checkout transaction:', error);
        res.status(500).json({ error: 'POS Transaction Failed' });
    }
});
