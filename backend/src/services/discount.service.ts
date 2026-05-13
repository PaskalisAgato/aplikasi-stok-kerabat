import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { VoucherPromoService } from './voucher_promo.service.js';

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

    static async getActiveDiscountRules() {
        return await db.select().from(schema.discountRules)
            .where(eq(schema.discountRules.active, true));
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
        if (data.value !== undefined) updateData.value = data.value?.toString() || '0';
        if (data.conditions !== undefined) updateData.conditions = JSON.stringify(data.conditions);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.isStackable !== undefined) updateData.isStackable = data.isStackable;
        if (data.isExclusive !== undefined) updateData.isExclusive = data.isExclusive;
        if (data.minPurchase !== undefined) updateData.minPurchase = data.minPurchase?.toString() || '0';
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
    static async redeemDiscounts(discountIds: number[], discountAmount: number, tx?: any) {
        if (!discountIds || discountIds.length === 0) return;
        const baseDb = tx || db;
        const amountPerDiscount = discountIds.length > 0 ? discountAmount / discountIds.length : 0;
        for (const id of discountIds) {
            await baseDb.update(schema.discounts).set({
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
        voucherCode?: string,
        orderSource?: string
    ) {
        const allActive = await this.getAllDiscounts(true); // already sorted by priority DESC
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0=Sun, 6=Sat
        const cartProductIds = cartItems.map(i => i.recipeId);
        
        // Fetch recipes to know their categories and names
        let cartRecipes: { id: number, category: string, name: string }[] = [];
        if (cartProductIds.length > 0) {
            console.log(`[Voucher Debug] Resolving Metadata for IDs: ${cartProductIds.join(', ')}`);
            cartRecipes = await db.select({ 
                id: schema.recipes.id, 
                category: schema.recipes.category,
                name: schema.recipes.name 
            })
                .from(schema.recipes)
                .where(inArray(schema.recipes.id, cartProductIds.map(id => Number(id))));
            console.log(`[Voucher Debug] Resolved ${cartRecipes.length} recipes from DB.`);
            cartRecipes.forEach(r => console.log(` - Resolved: ID ${r.id} -> Name: "${r.name}"`));
        }

        const itemsWithMetadata = cartItems.map(item => {
            const recipeId = Number(item.recipeId);
            const r = cartRecipes.find(cr => Number(cr.id) === recipeId);
            if (!r) console.warn(`[Voucher Debug] WARNING: No recipe found in DB for recipeId: ${recipeId}`);
            return { 
                ...item, 
                recipeId, // Coerce to number
                name: r?.name || 'Unknown',
                category: r?.category || 'Unknown' 
            };
        });

        const subtotal = cartItems.reduce((sum, i) => sum + (Number(i.price || 0) * (i.quantity || 0)), 0);

        const applicable: any[] = [];
        let hasExclusiveApplied = false;

        console.log(`[PROMO EVAL] Starting: ${itemsWithMetadata.length} items, subtotal: ${subtotal}, member: ${memberId}, source: ${orderSource}, code: ${voucherCode}`);
        
        for (const discount of allActive) {
            let conditions: any = {};
            try { conditions = discount.conditions ? JSON.parse(discount.conditions) : {}; } catch {}

            // ── Skip if orderSource doesn't match ────────────────────────
            if (conditions.orderSource && orderSource && conditions.orderSource !== orderSource) {
                 console.log(`[PROMO SKIP] "${discount.name}" - Order source mismatch (wanted: ${conditions.orderSource}, current: ${orderSource})`);
                 continue;
            }

            // ── Skip if budget is exhausted ───────────────────────────────
            if (discount.budgetLimit) {
                const remaining = parseFloat(discount.budgetLimit) - parseFloat(discount.budgetUsed || '0');
                if (remaining <= 0) {
                     console.log(`[PROMO SKIP] "${discount.name}" - Budget exhausted (${discount.budgetUsed}/${discount.budgetLimit})`);
                     continue;
                }
            }

            // ── Skip if total quota reached ───────────────────────────────
            if (discount.totalQuota !== null && (discount.totalUsed || 0) >= discount.totalQuota) {
                 console.log(`[PROMO SKIP] "${discount.name}" - Quota reached (${discount.totalUsed}/${discount.totalQuota})`);
                 continue;
            }

            // ── Skip if limit per user reached ────────────────────────────
            if (discount.limitPerUser !== null && memberId) {
                const usedByMember = await db.select({ count: sql<number>`count(*)` })
                    .from(schema.sales)
                    .where(and(
                        eq(schema.sales.memberId, memberId),
                        sql`(${schema.sales.discountId} = ${discount.id} OR 
                             ${schema.sales.discountIds} LIKE ${'%' + discount.id + '%'} OR
                             (${discount.voucherCode ? sql`${schema.sales.voucherCode} = ${discount.voucherCode}` : sql`false`}))`
                    ));
                const count = usedByMember[0]?.count || 0;
                if (count >= discount.limitPerUser) {
                    console.log(`[PROMO SKIP] "${discount.name}" - User limit reached (${count}/${discount.limitPerUser}) for member ${memberId}`);
                    continue;
                }
            }

            // ── HARD EXCLUSION: qr_voucher templates should NEVER be auto-applied ──
            if (discount.type === 'qr_voucher') {
                continue; 
            }

            // ── Voucher skip logic: don't auto-apply if it's a fixed discount record with a voucherCode ─────
            if (discount.voucherCode) {
                if (!voucherCode || voucherCode.toUpperCase().trim() !== discount.voucherCode) {
                    continue;
                }
            }

            // ── Date range validity ────────────────────────────────────────
            if (discount.startDate && now < new Date(discount.startDate)) {
                console.log(`[PROMO SKIP] "${discount.name}" - Not started yet (${discount.startDate})`);
                continue;
            }
            if (discount.endDate && now > new Date(discount.endDate)) {
                console.log(`[PROMO SKIP] "${discount.name}" - Expired (${discount.endDate})`);
                continue;
            }

            // ── Minimum purchase ───────────────────────────────────────────
            const minPurchase = parseFloat(discount.minPurchase || '0');
            if (subtotal < minPurchase) {
                console.log(`[PROMO SKIP] "${discount.name}" - Subtotal ${subtotal} < Min ${minPurchase}`);
                continue;
            }

            // ── Evaluate per type ──────────────────────────────────────────
            let applies = false;
            let discountAmount = 0;

            // Calculate targeted items
            let targetedSubtotal = subtotal;
            let targetItems = itemsWithMetadata;

            if (conditions.productIds && Array.isArray(conditions.productIds) && conditions.productIds.length > 0) {
                const targetIds = conditions.productIds.map(Number);
                targetItems = itemsWithMetadata.filter(i => targetIds.includes(i.recipeId));
                targetedSubtotal = targetItems.reduce((s, i) => s + (Number(i.price || 0) * (i.quantity || 0)), 0);
            } else if (conditions.category) {
                targetItems = itemsWithMetadata.filter(i => i.category === conditions.category);
                targetedSubtotal = targetItems.reduce((s, i) => s + (Number(i.price || 0) * (i.quantity || 0)), 0);
            }

            // Quick function to resolve value
            const calcAmount = (base: number) => {
                if (conditions.flatPrice) {
                    const flat = parseFloat(conditions.flatPrice);
                    const res = targetItems.reduce((sum, item) => {
                        const price = Number(item.price || 0);
                        const diff = price - flat;
                        return sum + (diff > 0 ? diff * (item.quantity || 0) : 0);
                    }, 0);
                    console.log(`[PROMO CALC] "${discount.name}" FlatPrice:${flat} | BasePrice:${base} | Result:${res}`);
                    return res;
                }
                if (conditions.discountType === 'percent' || discount.type === 'percent') {
                     const val = parseFloat(discount.value);
                     const res = (base * val) / 100;
                     console.log(`[PROMO CALC] "${discount.name}" Percent:${val}% | Base:${base} | Result:${res}`);
                     return res;
                }
                const res = parseFloat(discount.value);
                console.log(`[PROMO CALC] "${discount.name}" Nominal:${res} | Result:${res}`);
                return res;
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
                    if (!conditions.productIds || !Array.isArray(conditions.productIds)) break;
                    const targetIds = conditions.productIds.map(Number);
                    
                    const hasAll = targetIds.every((tid: number) => itemsWithMetadata.some(i => i.recipeId === tid));
                    
                    console.log(`[PROMO BUNDLE] "${discount.name}" -> target: ${targetIds} | hasAll: ${hasAll} | cart: ${itemsWithMetadata.map(i => i.recipeId)}`);
                    
                    if (hasAll) {
                        // How many full sets?
                        const setQty = Math.min(...targetIds.map((tid: number) => {
                            const found = itemsWithMetadata.find(i => i.recipeId === tid);
                            return found ? found.quantity : 0;
                        }));

                        const flat = parseFloat(conditions.flatPrice || discount.value || '0');
                        if (flat <= 0) {
                            console.log(`[PROMO SKIP] "${discount.name}" - Invalid flat price for bundling`);
                            break;
                        }

                        const bundleBaseSetPrice = targetIds.reduce((sum: number, tid: number) => {
                            const item = itemsWithMetadata.find(i => i.recipeId === tid);
                            return sum + (Number(item?.price || 0));
                        }, 0);
                        
                        const totalOriginalPrice = bundleBaseSetPrice * setQty;
                        const totalBundledPrice = flat * setQty;

                        console.log(`[PROMO BUNDLE] "${discount.name}" - Sets: ${setQty} | Original: ${totalOriginalPrice} | BundleFlat: ${totalBundledPrice}`);

                        if (totalOriginalPrice > totalBundledPrice) {
                            applies = true;
                            discountAmount = totalOriginalPrice - totalBundledPrice;
                        }
                    }
                    if (discount.discountCap) {
                        discountAmount = Math.min(discountAmount, parseFloat(discount.discountCap));
                    }
                    break;
                }

                case 'mix_and_match': {
                    const reqQty = conditions.minQty || 2;
                    const itemsInPool = targetItems.map(i => ({ price: Number(i.price), qty: i.quantity })).sort((a,b) => b.price - a.price);
                    
                    let totalEligibleQty = targetItems.reduce((sum, i) => sum + i.quantity, 0);
                    if (totalEligibleQty >= reqQty) {
                        applies = true;
                        const validSets = Math.floor(totalEligibleQty / reqQty);
                        
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
                        discountAmount = freeUnits * Number(cartItem.price);
                    }
                    break;
                }
            }

            console.log(`[PROMO EVAL] "${discount.name}" (${discount.type}) | targetItems: ${targetItems.length} | subtotal: ${targetedSubtotal} | calc: ${discountAmount} | applies: ${applies}`);
            if (!applies || discountAmount <= 0) continue;

            // ── Cap discountAmount if it would exceed remaining budget ─────
            if (discount.budgetLimit) {
                const remaining = parseFloat(discount.budgetLimit) - parseFloat(discount.budgetUsed || '0');
                discountAmount = Math.min(discountAmount, remaining);
            }

            applicable.push({
                ...discount,
                discountAmount: Math.round(discountAmount || 0),
                conditions,
            });

            if (discount.isExclusive) {
                // Return immediately if an exclusive promo applies - nothing else should even be seen
                return [{
                    ...discount,
                    discountAmount: Math.round(discountAmount),
                    conditions,
                }];
            }
        }

        // ── Phase 5/6: Voucher Injection (Promo or Barcode) ────────────────
        if (voucherCode && voucherCode.startsWith('KKT-')) {
            try {
                const pResult = (await VoucherPromoService.validateVoucher(voucherCode).catch(() => ({ valid: false }))) as any;
                if (pResult?.valid && pResult.voucher) {
                    const v = pResult.voucher;
                    let promoDiscountAmount = 0;
                    let promoName = v.menuName ? `Voucher: ${v.menuName}` : 'Marketing Promo Voucher';

                    if (v.menuName) {
                        // Priority 1: Find voucher item in cart using the name we fetched
                        // We use the names from recipes table which we just resolved into itemsWithMetadata
                        const cartItemMatch = itemsWithMetadata.find(i => {
                            const itemName = i.name.toLowerCase().replace(/[^\w]/g, '').trim();
                            const targetName = v.menuName!.toLowerCase().replace(/[^\w]/g, '').trim();
                            const isMatch = itemName === targetName || itemName.includes(targetName) || targetName.includes(itemName);
                            console.log(`[Voucher Match Debug] Original Item: "${i.name}" (ID: ${i.recipeId}) vs Original Target: "${v.menuName}"`);
                            console.log(`[Voucher Match Debug] Ultra-Normalized: "${itemName}" vs "${targetName}" -> Match: ${isMatch}`);
                            return isMatch;
                        });

                        if (cartItemMatch) {
                            if (v.voucherPrice) {
                                promoDiscountAmount = (parseFloat(cartItemMatch.price.toString()) - parseFloat(v.voucherPrice)) * cartItemMatch.quantity;
                            } else if (v.discountNominal) {
                                promoDiscountAmount = parseFloat(v.discountNominal) * cartItemMatch.quantity;
                            }
                        }
                    } else if (v.discountNominal) {
                        // Flat transaction discount
                        promoDiscountAmount = parseFloat(v.discountNominal);
                    }

                    if (promoDiscountAmount > 0) {
                        applicable.push({
                            id: -1001, // Unique ID for Promo Vouchers
                            name: promoName,
                            type: 'nominal',
                            value: promoDiscountAmount.toString(),
                            discountAmount: Math.round(promoDiscountAmount),
                            priority: 200,
                            isStackable: true,
                            isExclusive: false,
                            voucherCode: voucherCode,
                            code: voucherCode
                        });
                        return applicable; // Usually marketing vouchers are one per txn and top priority
                    } else {
                        throw new Error(`Item ${v.menuName} tidak ditemukan di keranjang belanja.`);
                    }
                }

                const { VoucherService } = await import('./voucher_barcode.service.js');
                const vResult = (await VoucherService.validateVoucher(voucherCode).catch(err => ({ valid: false, message: err.message }))) as any;
                
                if (!vResult.valid || !vResult.voucher) {
                    // console.warn(`[Voucher Eval] Validation failed: ${vResult.message}`);
                    throw new Error(`VALIDATION_FAILED: ${vResult.message || 'Voucher tidak ditemukan'} (${voucherCode})`);
                }

                if (vResult.voucher.status === 'redeemed') {
                    throw new Error(`Voucher Gagal: Voucher ${voucherCode} sudah pernah digunakan.`);
                }
                
                if (vResult.valid) {
                    // Phase 6: Fetch dynamic settings from a record with type 'qr_voucher'
                    const qrTemplates = await db.select()
                        .from(schema.discounts)
                        .where(and(
                            eq(schema.discounts.type, 'qr_voucher'),
                            eq(schema.discounts.isActive, true)
                        ));
                    
                    const qrTemplate = qrTemplates[0];
                    if (!qrTemplate) {
                         // Don't throw, just use defaults from voucher record, but log it
                         console.log('[QR Voucher] No template found, using defaults.');
                    }

                    const qrValueDB = parseFloat(vResult.voucher?.discountValue || '20');
                    const qrTypeDB = vResult.voucher?.benefitType === 'nominal' ? 'nominal' : 'percent';
                    const qrStatusDB = vResult.voucher?.status || 'unused';

                    if (qrStatusDB === 'redeemed') {
                        throw new Error('Validasi Gagal: Voucher sudah digunakan sebelumnya');
                    }
                    if (vResult.voucher?.expiresAt && new Date() > new Date(vResult.voucher.expiresAt)) {
                        throw new Error('Validasi Gagal: Voucher sudah kadaluwarsa');
                    }

                    const qrValue = (qrTemplate && parseFloat(qrTemplate.value) > 0) ? parseFloat(qrTemplate.value) : qrValueDB;
                    const qrConditions = qrTemplate?.conditions ? JSON.parse(qrTemplate.conditions) : {}; 

                    // Validation: Order Source Restrict (e.g. only STAND or only DIRECT)
                    console.log(`[QR Eval] Checking Source: ${orderSource}, Allowed:`, qrConditions.orderSources);
                    if (qrConditions.orderSources && Array.isArray(qrConditions.orderSources) && qrConditions.orderSources.length > 0) {
                        const isSourceAllowed = qrConditions.orderSources.some((s: string) => s.toUpperCase() === orderSource?.toUpperCase());
                        if (!isSourceAllowed) {
                            console.log(`[QR Voucher Eval] Rejected: Order source ${orderSource} not in allowed:`, qrConditions.orderSources);
                            throw new Error(`ORDER_SOURCE_NOT_ALLOWED: Order source ${orderSource} not in ${JSON.stringify(qrConditions.orderSources)}`);
                        }
                    }
                    
                    // Filter items by category or productIds from template
                    let targetItems = itemsWithMetadata;
                    console.log(`[QR Eval] Checking Category: ${qrConditions.category}, RedemptionIds:`, qrConditions.redemptionProductIds);
                    if (qrConditions.category) {
                        targetItems = itemsWithMetadata.filter(i => i.category.toLowerCase().includes(qrConditions.category.toLowerCase()));
                    } else if (qrConditions.redemptionProductIds) {
                        const tIds = qrConditions.redemptionProductIds.map(Number);
                        targetItems = itemsWithMetadata.filter(i => tIds.includes(i.recipeId));
                    }

                    const qrBaseSubtotal = targetItems.reduce((s, i) => {
                        const price = parseFloat(i.price?.toString() || '0');
                        const qty = parseFloat(i.quantity?.toString() || '0');
                        return s + (price * qty);
                    }, 0);
                    console.log(`[QR Eval] Base Subtotal for match: ${qrBaseSubtotal}`);
                    
                    // Evaluate discount type
                    let qrDiscountAmount = 0;
                    const isNominal = qrTypeDB === 'nominal' || (qrTemplate && qrTemplate.type === 'nominal') || qrValue > 100;
                    
                    if (isNominal) {
                        qrDiscountAmount = qrValue;
                    } else {
                        qrDiscountAmount = (qrBaseSubtotal * qrValue) / 100;
                    }

                    console.log(`[QR Eval] Final Discount Amount: ${qrDiscountAmount}`);
                    
                    if (qrDiscountAmount > 0) {
                        applicable.push({
                            id: qrTemplate?.id || -999,
                            name: qrTemplate?.name || `QR Voucher Discount (${voucherCode})`,
                            type: qrTypeDB,
                            value: qrValue.toString(),
                            discountAmount: Math.round(qrDiscountAmount),
                            priority: 100,
                            isStackable: true,
                            isExclusive: false,
                            conditions: qrConditions,
                            voucherCode: voucherCode,
                            code: voucherCode // Added for frontend matching compatibility
                        });
                    } else {
                        const reason = qrConditions.category 
                            ? `Voucher ini hanya berlaku untuk kategori: ${qrConditions.category}`
                            : (qrConditions.redemptionProductIds ? 'Voucher ini hanya berlaku untuk menu tertentu.' : 'Voucher tidak dapat diterapkan pada menu ini.');
                        throw new Error(`Validasi Gagal: ${reason}`);
                    }
                }
            } catch (vErr: any) {
                console.warn('[QR Voucher Eval] Failed:', vErr);
                // Simplify the message for the user if it's our known format
                const msg = vErr.message?.includes('Validasi Gagal:') ? vErr.message : `Voucher Tidak Valid: ${vErr.message}`;
                throw new Error(msg);
            }
        }

        // Return all applicable promos found.
        // Frontend will handle allowing the user to select between them.
        return applicable;
    }
}
