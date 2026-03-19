import { Router, Request, Response } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth'; 

export const salesRouter = Router();

// POST Checkout Cart
salesRouter.post('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const { shiftId, items, subTotal, totalAmount, paymentMethod } = req.body;
        // Mock userId if auth not attached. Better Auth usually injects req.user
        const userId = (req as any).user?.id || 'anonymous';
        console.log(`[CHECKOUT] User ID: ${userId}, items count: ${items?.length}, shiftId: ${shiftId}`);
        console.log(`[CHECKOUT] Payload SubTotal: ${subTotal}, TotalAmount: ${totalAmount}`);
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate totals if missing to avoid .toString() crashes
        let calculatedSubTotal = subTotal ? parseFloat(subTotal.toString()) : 0;
        if (isNaN(calculatedSubTotal)) calculatedSubTotal = 0;

        if (calculatedSubTotal === 0 && items) {
            calculatedSubTotal = items.reduce((acc, item) => {
                const p = parseFloat(item.price?.toString() || '0');
                return acc + (isNaN(p) ? 0 : p * (item.quantity || 0));
            }, 0);
        }

        let finalTotalAmount = totalAmount ? parseFloat(totalAmount.toString()) : calculatedSubTotal;
        if (isNaN(finalTotalAmount)) finalTotalAmount = calculatedSubTotal;
        
        console.log(`[CHECKOUT] Calculated SubTotal: ${calculatedSubTotal}, Final Total: ${finalTotalAmount}`);
        
        await db.transaction(async (tx) => {
            // 1. Record Sale
            const [newSale] = await tx.insert(schema.sales).values({
                shiftId: shiftId ? parseInt(shiftId.toString()) : null,
                userId,
                subTotal: calculatedSubTotal.toString(),
                taxAmount: '0',
                serviceChargeAmount: '0',
                totalAmount: finalTotalAmount.toString(),
                paymentMethod: paymentMethod || 'CASH'
            }).returning();

            // 2. Record Sale Items
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
                 // 3. BOM Automation: Deduct Stock
                const recipeIngs = await tx.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, item.recipeId));
                
                for (const bom of recipeIngs) {
                    const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where(eq(schema.inventory.id, bom.inventoryId));
                    const invItem = invItemArr[0];
                    if (!invItem) continue;

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
                            currentStock: sql`${schema.inventory.currentStock} - ${baseDeductQty}`
                        })
                        .where(eq(schema.inventory.id, bom.inventoryId));
                }
            }
        });

        res.status(201).json({ success: true, message: 'Checkout completed successfully' });
    } catch (error: any) {
        console.error('--- POS CHECKOUT FATAL ERROR ---');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        if (error.code) console.error('DB Error Code:', error.code);
        if (error.detail) console.error('DB Error Detail:', error.detail);
        console.error('--------------------------------');
        res.status(500).json({ error: 'POS Transaction Failed', detail: error.message });
    }
});
