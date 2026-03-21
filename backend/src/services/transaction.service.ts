import { eq, sql } from 'drizzle-orm';
import { db } from '../config/db';
import * as schema from '../db/schema';

export class TransactionService {
    static async processCheckout(data: any, userId: string) {
        const { shiftId, items, subTotal, totalAmount, paymentMethod } = data;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('No items in cart');
        }

        // Calculate subtotal from items if not provided
        let calculatedSubTotal = subTotal ? parseFloat(subTotal.toString()) : 0;
        if (isNaN(calculatedSubTotal)) calculatedSubTotal = 0;

        if (calculatedSubTotal === 0) {
            calculatedSubTotal = items.reduce((acc: number, item: any) => {
                const p = parseFloat(item.price?.toString() || '0');
                return acc + (isNaN(p) ? 0 : p * (item.quantity || 0));
            }, 0);
        }

        let finalTotalAmount = totalAmount ? parseFloat(totalAmount.toString()) : calculatedSubTotal;
        if (isNaN(finalTotalAmount)) finalTotalAmount = calculatedSubTotal;

        // Build the sale record
        const parsedShiftId = (shiftId !== null && shiftId !== undefined && shiftId !== '')
            ? parseInt(shiftId.toString())
            : NaN;

        const saleValues: any = {
            shiftId: !isNaN(parsedShiftId) ? parsedShiftId : sql`NULL`,
            userId,
            subTotal: calculatedSubTotal.toString(),
            taxAmount: '0',
            serviceChargeAmount: '0',
            totalAmount: finalTotalAmount.toString(),
            paymentMethod: paymentMethod || 'CASH'
        };

        return await db.transaction(async (tx) => {
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
                const recipeIngs = await tx.select().from(schema.recipeIngredients).where(eq(schema.recipeIngredients.recipeId, item.recipeId));
                
                for (const bom of recipeIngs) {
                    const invItemArr = await tx.select({ unit: schema.inventory.unit }).from(schema.inventory).where(eq(schema.inventory.id, bom.inventoryId));
                    const invItem = invItemArr[0];
                    if (!invItem) continue;

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
                            currentStock: sql`${schema.inventory.currentStock} - ${baseDeductQty}`
                        })
                        .where(eq(schema.inventory.id, bom.inventoryId));
                }
            }
            return { success: true, transactionId: newSale.id };
        });
    }
}

