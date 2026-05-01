import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';

export class DiscountService {
    static async getAllDiscounts(activeOnly = false) {
        if (activeOnly) {
            return await db.select().from(schema.discounts)
                .where(eq(schema.discounts.isActive, true))
                .orderBy(desc(schema.discounts.priority));
        }
        return await db.select().from(schema.discounts)
            .orderBy(desc(schema.discounts.priority));
    }

    static async getDiscountById(id: number) {
        const [d] = await db.select().from(schema.discounts).where(eq(schema.discounts.id, id)).limit(1);
        return d || null;
    }

    static async createDiscount(data: any, userId?: string) {
        const [created] = await db.insert(schema.discounts).values({
            name: data.name,
            type: data.type,
            value: data.value?.toString() || '0',
            conditions: data.conditions ? JSON.stringify(data.conditions) : null,
            minPurchase: data.minPurchase?.toString() || '0',
            isActive: data.isActive ?? true,
            isStackable: data.isStackable ?? false,
            isExclusive: data.isExclusive ?? false,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            // Financial Controls
            discountCap: data.discountCap ? data.discountCap.toString() : null,
            budgetLimit: data.budgetLimit ? data.budgetLimit.toString() : null,
            // Quota
            totalQuota: data.totalQuota ? parseInt(data.totalQuota) : null,
            limitPerUser: data.limitPerUser ? parseInt(data.limitPerUser) : null,
            // Priority & Distribution
            priority: data.priority ? parseInt(data.priority) : 5,
            voucherCode: data.voucherCode ? data.voucherCode.toUpperCase().trim() : null,
            // Audit
            createdBy: userId || null,
            updatedBy: userId || null,
        }).returning();
        return created;
    }

    static async updateDiscount(id: number, data: any, userId?: string) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.value !== undefined) updateData.value = data.value.toString();
        if (data.conditions !== undefined) updateData.conditions = JSON.stringify(data.conditions);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.isStackable !== undefined) updateData.isStackable = data.isStackable;
        if (data.isExclusive !== undefined) updateData.isExclusive = data.isExclusive;
        if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase.toString();
        if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
        // Financial Controls
        if (data.discountCap !== undefined) updateData.discountCap = data.discountCap ? data.discountCap.toString() : null;
        if (data.budgetLimit !== undefined) updateData.budgetLimit = data.budgetLimit ? data.budgetLimit.toString() : null;
        // Quota
        if (data.totalQuota !== undefined) updateData.totalQuota = data.totalQuota ? parseInt(data.totalQuota) : null;
        if (data.limitPerUser !== undefined) updateData.limitPerUser = data.limitPerUser ? parseInt(data.limitPerUser) : null;
        // Priority & Distribution
        if (data.priority !== undefined) updateData.priority = parseInt(data.priority);
        if (data.voucherCode !== undefined) updateData.voucherCode = data.voucherCode ? data.voucherCode.toUpperCase().trim() : null;
        // Audit
        if (userId) updateData.updatedBy = userId;

        const [updated] = await db.update(schema.discounts).set(updateData).where(eq(schema.discounts.id, id)).returning();
        if (!updated) throw new Error('Diskon tidak ditemukan');
        return updated;
    }

    static async deleteDiscount(id: number) {
        await db.delete(schema.discounts).where(eq(schema.discounts.id, id));
    }

    /**
     * Get per-promo analytics stats
     */
    static async getDiscountStats(id: number) {
        const discount = await this.getDiscountById(id);
        if (!discount) throw new Error('Diskon tidak ditemukan');
        return {
            id: discount.id,
            name: discount.name,
            totalUsed: discount.totalUsed || 0,
            budgetUsed: parseFloat(discount.budgetUsed || '0'),
            budgetLimit: discount.budgetLimit ? parseFloat(discount.budgetLimit) : null,
            totalQuota: discount.totalQuota,
            budgetProgress: discount.budgetLimit
                ? Math.min(100, (parseFloat(discount.budgetUsed || '0') / parseFloat(discount.budgetLimit)) * 100)
                : null,
            quotaProgress: discount.totalQuota
                ? Math.min(100, ((discount.totalUsed || 0) / discount.totalQuota) * 100)
                : null,
        };
    }

    /**
     * After a successful checkout, increment usage counters.
     * Called from TransactionService after a sale is recorded.
     */
    static async redeemDiscounts(discountIds: number[], discountAmount: number) {
        if (!discountIds || discountIds.length === 0) return;
        const amountPerDiscount = discountIds.length > 0 ? discountAmount / discountIds.length : 0;
        for (const id of discountIds) {
            await db.update(schema.discounts).set({
                totalUsed: sql`${schema.discounts.totalUsed} + 1`,
                budgetUsed: sql`${schema.discounts.budgetUsed} + ${amountPerDiscount.toFixed(2)}`
            }).where(eq(schema.discounts.id, id));
        }
    }

    /**
     * Evaluate which discounts apply to the given cart & context.
     * Supports: priority, discount cap, exclusive flag, budget limit, total quota, voucher code.
     * Returns a list of applicable discounts with calculated amounts.
     */
    static async evaluateDiscounts(
        cartItems: { recipeId: number; quantity: number; price: number }[],
        memberLevel?: string,
        memberId?: number,
        voucherCode?: string
    ) {
        const allActive = await this.getAllDiscounts(true); // already sorted by priority DESC
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0=Sun, 6=Sat
        const cartProductIds = cartItems.map(i => i.recipeId);
        
        // Fetch recipes to know their categories
        let cartRecipes: { id: number, category: string }[] = [];
        if (cartProductIds.length > 0) {
            cartRecipes = await db.select({ id: schema.recipes.id, category: schema.recipes.category })
                .from(schema.recipes)
                .where(inArray(schema.recipes.id, cartProductIds));
        }

        const itemsWithMetadata = cartItems.map(item => {
            const r = cartRecipes.find(cr => cr.id === item.recipeId);
            return { ...item, category: r?.category || 'Unknown' };
        });

        const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const applicable: any[] = [];
        let hasExclusiveApplied = false;

        for (const discount of allActive) {
            // ── Skip if budget is exhausted ───────────────────────────────
            if (discount.budgetLimit) {
                const remaining = parseFloat(discount.budgetLimit) - parseFloat(discount.budgetUsed || '0');
                if (remaining <= 0) continue;
            }

            // ── Skip if total quota reached ───────────────────────────────
            if (discount.totalQuota !== null && (discount.totalUsed || 0) >= discount.totalQuota) continue;

            // ── Voucher logic: skip auto-apply if voucherCode is set ─────
            if (discount.voucherCode) {
                // Only apply if the user explicitly entered this code
                if (!voucherCode || voucherCode.toUpperCase().trim() !== discount.voucherCode) continue;
            }

            // ── Date range validity ────────────────────────────────────────
            if (discount.startDate && now < new Date(discount.startDate)) continue;
            if (discount.endDate && now > new Date(discount.endDate)) continue;

            let conditions: any = {};
            try { conditions = discount.conditions ? JSON.parse(discount.conditions) : {}; } catch {}

            // ── Minimum purchase ───────────────────────────────────────────
            const minPurchase = parseFloat(discount.minPurchase || '0');
            if (subtotal < minPurchase) continue;

            // ── Evaluate per type ──────────────────────────────────────────
            let applies = false;
            let discountAmount = 0;

            // Calculate targeted items
            let targetedSubtotal = subtotal;
            let targetItems = itemsWithMetadata;

            if (conditions.productIds && conditions.productIds.length > 0) {
                targetItems = itemsWithMetadata.filter(i => conditions.productIds.includes(i.recipeId));
                targetedSubtotal = targetItems.reduce((s, i) => s + (i.price * i.quantity), 0);
            } else if (conditions.category) {
                targetItems = itemsWithMetadata.filter(i => i.category === conditions.category);
                targetedSubtotal = targetItems.reduce((s, i) => s + (i.price * i.quantity), 0);
            }

            // Quick function to resolve value
            const calcAmount = (base: number) => {
                if (conditions.flatPrice) {
                    // Flat price means each targeted item is sold at flatPrice
                    const flat = parseFloat(conditions.flatPrice);
                    return targetItems.reduce((sum, item) => {
                        const diff = item.price - flat;
                        return sum + (diff > 0 ? diff * item.quantity : 0);
                    }, 0);
                }
                if (conditions.discountType === 'percent' || discount.type === 'percent') {
                     return (base * parseFloat(discount.value)) / 100;
                }
                return parseFloat(discount.value);
            };

            switch (discount.type) {
                case 'percent':
                case 'nominal':
                    if (targetItems.length > 0) {
                        applies = true;
                        discountAmount = calcAmount(targetedSubtotal);
                    }
                    if (discount.discountCap) {
                        discountAmount = Math.min(discountAmount, parseFloat(discount.discountCap));
                    }
                    break;

                case 'time-based': {
                    const dayMatch = !conditions.days || conditions.days.length === 0 || conditions.days.includes(currentDay);
                    const hourMatch = conditions.startHour === undefined ||
                        (currentHour >= conditions.startHour && currentHour < conditions.endHour);
                    applies = dayMatch && hourMatch && targetItems.length > 0;
                    if (applies) {
                        discountAmount = calcAmount(targetedSubtotal);
                        if (discount.discountCap) discountAmount = Math.min(discountAmount, parseFloat(discount.discountCap));
                    }
                    break;
                }

                case 'bundling': {
                    if (!conditions.productIds || conditions.productIds.length === 0) break;
                    // For bundle, user must have EVERY product id in the bundle
                    applies = conditions.productIds.every((pid: number) => cartProductIds.includes(pid));
                    if (applies) {
                        // Find how many sets are bought
                        const setQty = Math.min(...conditions.productIds.map((pid: number) => {
                            const found = targetItems.find(i => i.recipeId === pid);
                            return found ? found.quantity : 0;
                        }));

                        const bundleBaseSetPrice = targetItems
                            .filter(i => conditions.productIds.includes(i.recipeId))
                            .reduce((s, i) => s + i.price, 0); 
                            
                        const bundleSubtotal = bundleBaseSetPrice * setQty;

                        if (conditions.flatPrice) {
                           const diff = bundleSubtotal - (setQty * parseFloat(conditions.flatPrice));
                           discountAmount = diff > 0 ? diff : 0;
                        } else {
                           discountAmount = calcAmount(bundleSubtotal);
                           // Prevent flatPrice from duplicating inside calcAmount, so we bypass calcAmount for flatPrice here
                        }
                        
                        if (discount.discountCap) discountAmount = Math.min(discountAmount, parseFloat(discount.discountCap));
                    }
                    break;
                }

                case 'mix_and_match': {
                    // e.g., Buy 2 Minuman for a flat price of 25.000
                    const reqQty = conditions.minQty || 2;
                    const itemsInPool = targetItems.map(i => ({ price: i.price, qty: i.quantity })).sort((a,b) => b.price - a.price);
                    
                    let totalEligibleQty = targetItems.reduce((sum, i) => sum + i.quantity, 0);
                    if (totalEligibleQty >= reqQty) {
                        applies = true;
                        const validSets = Math.floor(totalEligibleQty / reqQty);
                        
                        // We discount the N most expensive eligible items per set to maximize benefit
                        let discountedTotalValue = 0;
                        let itemsToGrab = validSets * reqQty;
                        for (const it of itemsInPool) {
                            if (itemsToGrab <= 0) break;
                            const qtyToTake = Math.min(it.qty, itemsToGrab);
                            discountedTotalValue += (qtyToTake * it.price);
                            itemsToGrab -= qtyToTake;
                        }
                        
                        if (conditions.flatPrice) {
                            const expectedPrice = validSets * parseFloat(conditions.flatPrice);
                            discountAmount = discountedTotalValue - expectedPrice;
                        } else {
                            discountAmount = calcAmount(discountedTotalValue);
                        }
                    }
                    break;
                }

                case 'member': {
                    if (!memberLevel) break;
                    const levels: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };
                    const requiredLevel = conditions.minLevel || 'bronze';
                    applies = (levels[memberLevel] || 0) >= (levels[requiredLevel] || 0);
                    if (applies) {
                        discountAmount = calcAmount(subtotal);
                        if (discount.discountCap) discountAmount = Math.min(discountAmount, parseFloat(discount.discountCap));
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
                        const setSize = buyQty + freeQty;
                        const freeUnits = Math.floor(cartItem.quantity / setSize) * freeQty;
                        discountAmount = freeUnits * cartItem.price;
                    }
                    break;
                }
            }

            if (!applies || discountAmount <= 0) continue;

            // ── Cap discountAmount if it would exceed remaining budget ─────
            if (discount.budgetLimit) {
                const remaining = parseFloat(discount.budgetLimit) - parseFloat(discount.budgetUsed || '0');
                discountAmount = Math.min(discountAmount, remaining);
            }

            applicable.push({
                ...discount,
                discountAmount: Math.round(discountAmount),
                conditions,
            });

            // ── Exclusive logic: stop evaluating more promos ───────────────
            if (discount.isExclusive) {
                hasExclusiveApplied = true;
                break;
            }
        }

        // If a non-exclusive exclusive promo was not hit, filter out non-stackable duplicates:
        // Only the highest-priority non-stackable promo survives
        if (!hasExclusiveApplied) {
            const nonStackable = applicable.filter(d => !d.isStackable);
            const stackable = applicable.filter(d => d.isStackable);
            // Keep at most 1 non-stackable (already highest priority due to sort order)
            return [...(nonStackable.length > 0 ? [nonStackable[0]] : []), ...stackable];
        }

        return applicable;
    }
}
