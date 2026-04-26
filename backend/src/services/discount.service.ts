import { eq, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';

export class DiscountService {
    static async getAllDiscounts(activeOnly = false) {
        if (activeOnly) {
            return await db.select().from(schema.discounts).where(eq(schema.discounts.isActive, true));
        }
        return await db.select().from(schema.discounts);
    }

    static async getDiscountById(id: number) {
        const [d] = await db.select().from(schema.discounts).where(eq(schema.discounts.id, id)).limit(1);
        return d || null;
    }

    static async createDiscount(data: any) {
        const [created] = await db.insert(schema.discounts).values({
            name: data.name,
            type: data.type,
            value: data.value?.toString() || '0',
            conditions: data.conditions ? JSON.stringify(data.conditions) : null,
            minPurchase: data.minPurchase?.toString() || '0',
            isActive: data.isActive ?? true,
            isStackable: data.isStackable ?? false,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
        }).returning();
        return created;
    }

    static async updateDiscount(id: number, data: any) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value.toString();
        if (data.conditions !== undefined) updateData.conditions = JSON.stringify(data.conditions);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.isStackable !== undefined) updateData.isStackable = data.isStackable;
        if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase.toString();
        if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

        const [updated] = await db.update(schema.discounts).set(updateData).where(eq(schema.discounts.id, id)).returning();
        if (!updated) throw new Error('Diskon tidak ditemukan');
        return updated;
    }

    static async deleteDiscount(id: number) {
        await db.delete(schema.discounts).where(eq(schema.discounts.id, id));
    }

    /**
     * Evaluate which discounts apply to the given cart & context.
     * Returns a list of applicable discounts with calculated amounts.
     */
    static async evaluateDiscounts(cartItems: { recipeId: number; quantity: number; price: number }[], memberLevel?: string) {
        const active = await this.getAllDiscounts(true);
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0=Sun, 6=Sat
        const cartProductIds = cartItems.map(i => i.recipeId);
        const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const applicable: any[] = [];

        for (const discount of active) {
            // Check date range validity
            if (discount.startDate && now < new Date(discount.startDate)) continue;
            if (discount.endDate && now > new Date(discount.endDate)) continue;

            let conditions: any = {};
            try { conditions = discount.conditions ? JSON.parse(discount.conditions) : {}; } catch {}

            // Check minimum purchase
            const minPurchase = parseFloat(discount.minPurchase || '0');
            if (subtotal < minPurchase) continue;

            let applies = false;
            let discountAmount = 0;

            switch (discount.type) {
                case 'percent':
                    applies = true;
                    discountAmount = (subtotal * parseFloat(discount.value)) / 100;
                    break;
                case 'nominal':
                    applies = true;
                    discountAmount = parseFloat(discount.value);
                    break;
                case 'time-based': {
                    const dayMatch = !conditions.days || conditions.days.includes(currentDay);
                    const hourMatch = !conditions.startHour || (currentHour >= conditions.startHour && currentHour < conditions.endHour);
                    applies = dayMatch && hourMatch;
                    if (applies) {
                        discountAmount = conditions.discountType === 'percent'
                            ? (subtotal * parseFloat(discount.value)) / 100
                            : parseFloat(discount.value);
                    }
                    break;
                }
                case 'bundling': {
                    if (!conditions.productIds || conditions.productIds.length === 0) break;
                    // All required products must be in the cart
                    applies = conditions.productIds.every((pid: number) => cartProductIds.includes(pid));
                    if (applies) {
                        discountAmount = conditions.discountType === 'percent'
                            ? (subtotal * parseFloat(discount.value)) / 100
                            : parseFloat(discount.value);
                    }
                    break;
                }
                case 'member': {
                    if (!memberLevel) break;
                    const levels: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };
                    const requiredLevel = conditions.minLevel || 'bronze';
                    applies = (levels[memberLevel] || 0) >= (levels[requiredLevel] || 0);
                    if (applies) {
                        discountAmount = conditions.discountType === 'percent'
                            ? (subtotal * parseFloat(discount.value)) / 100
                            : parseFloat(discount.value);
                    }
                    break;
                }
                case 'buy_x_get_y': {
                    const buyQty = conditions.buyQty || 2;
                    const freeQty = conditions.freeQty || 1;
                    const targetRecipeId = conditions.recipeId;
                    
                    const cartItem = cartItems.find(i => i.recipeId === targetRecipeId);
                    if (cartItem && cartItem.quantity >= buyQty) {
                        applies = true;
                        // Example: Buy 2 Get 1 Free. If 3 in cart, 1 is free.
                        // Formula: floor(qty / (buy + free)) * price
                        // OR floor(qty / buy) * price * free? 
                        // User said "Beli 2 gratis 1", usually means buy 2, total 3, pay 2.
                        const setSize = buyQty + freeQty;
                        const freeUnits = Math.floor(cartItem.quantity / setSize) * freeQty;
                        discountAmount = freeUnits * cartItem.price;
                    }
                    break;
                }
            }

            if (applies && discountAmount >= 0) {
                applicable.push({
                    ...discount,
                    discountAmount: Math.round(discountAmount),
                    conditions,
                });
            }
        }

        return applicable;
    }
}
