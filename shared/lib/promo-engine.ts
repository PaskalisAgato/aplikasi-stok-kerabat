export type PromoType = 'fixed' | 'percentage' | 'bundling' | 'mix_and_match';

export interface DiscountRule {
    id: string; // uuid
    code: string;
    type: PromoType;
    value: number; // For percentage: 20 means 20%
    minPurchase: number;
    maxDiscount?: number | null;
    conditions?: string | Record<string, any> | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    usageLimit?: number | null;
    usedCount: number;
    active: boolean;
    stackable: boolean;
    configVersion: number;
}

export interface PromoCartItem {
    recipeId: number;
    quantity: number;
    price: number;
    category?: string;
}

export interface PromoValidationResult {
    valid: boolean;
    reason?: string;
    discountAmount: number;
    promoData?: DiscountRule;
}

export class PromoEngine {
    /**
     * Deterministically calculates the discount given cart items, subtotal, and a rule.
     * @param subtotal Total amount before discount
     * @param items Array of cart items (needed for item-specific promos like bundling)
     * @param rule The single source of truth discount rule
     * @returns structured validation result
     */
    static evaluate(subtotal: number, items: PromoCartItem[], rule: DiscountRule): PromoValidationResult {
        // 1. Check Activity
        if (!rule.active) {
            return { valid: false, reason: "Promo tidak aktif", discountAmount: 0 };
        }

        // 2. Check Date constraints
        const now = new Date();
        if (rule.startDate && now < new Date(rule.startDate)) {
            return { valid: false, reason: "Promo belum dimulai", discountAmount: 0 };
        }
        if (rule.endDate && now > new Date(rule.endDate)) {
            return { valid: false, reason: "Promo sudah kadaluarsa", discountAmount: 0 };
        }

        // 3. Check usage constraints
        if (rule.usageLimit && rule.usedCount >= rule.usageLimit) {
            return { valid: false, reason: "Batas pemakaian promo sudah habis", discountAmount: 0 };
        }

        // 4. Check Minimum Purchase
        if (subtotal < rule.minPurchase) {
            return { valid: false, reason: `Minimal pembelian Rp ${rule.minPurchase.toLocaleString('id-ID')}`, discountAmount: 0 };
        }

        // 5. Calculate Discount deterministically
        let discount = 0;
        
        let conditionsObj: any = {};
        if (rule.conditions) {
            conditionsObj = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
        }

        if (rule.type === 'fixed') {
            discount = Number(rule.value);
        } else if (rule.type === 'percentage') {
            discount = Math.floor((subtotal * Number(rule.value)) / 100);
        } else if (rule.type === 'bundling') {
            if (!conditionsObj.productIds || !Array.isArray(conditionsObj.productIds)) {
                return { valid: false, reason: "Syarat item bundling tidak ditemukan", discountAmount: 0 };
            }
            const targetIds = conditionsObj.productIds.map(Number);
            const hasAll = targetIds.every((tid: number) => items.some(i => i.recipeId === tid));
            
            if (!hasAll) {
                return { valid: false, reason: "Item bundle belum lengkap dibeli", discountAmount: 0 };
            }

            const setQty = Math.min(...targetIds.map((tid: number) => {
                const found = items.find(i => i.recipeId === tid);
                return found ? found.quantity : 0;
            }));

            const flat = Number(conditionsObj.flatPrice || rule.value || 0);
            if (flat <= 0) return { valid: false, reason: "Nilai potongan bundle tidak valid", discountAmount: 0 };

            const bundleBaseSetPrice = targetIds.reduce((sum: number, tid: number) => {
                const item = items.find(i => i.recipeId === tid);
                return sum + (Number(item?.price || 0));
            }, 0);
            
            const totalOriginalPrice = bundleBaseSetPrice * setQty;
            const totalBundledPrice = flat * setQty;

            if (totalOriginalPrice > totalBundledPrice) {
                discount = totalOriginalPrice - totalBundledPrice;
            } else {
                return { valid: false, reason: "Bundling promo tidak memberikan potongan", discountAmount: 0 };
            }
        }

        // 6. Apply Maximum Discount Cap if exists
        const cap = rule.maxDiscount ? Number(rule.maxDiscount) : null;
        if (cap !== null && cap > 0 && discount > cap) {
            discount = cap;
        }
        
        // Prevent discount from being higher than subtotal
        if (discount > subtotal) {
            discount = subtotal;
        }

        return {
            valid: true,
            discountAmount: discount,
            promoData: rule
        };
    }
}
