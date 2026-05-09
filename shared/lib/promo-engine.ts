export type PromoType = 'fixed' | 'percentage';

export interface DiscountRule {
    id: string; // uuid
    code: string;
    type: PromoType;
    value: number; // For percentage: 20 means 20%
    minPurchase: number;
    maxDiscount?: number | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    usageLimit?: number | null;
    usedCount: number;
    active: boolean;
    stackable: boolean;
    configVersion: number;
}

export interface PromoValidationResult {
    valid: boolean;
    reason?: string;
    discountAmount: number;
    promoData?: DiscountRule;
}

export class PromoEngine {
    /**
     * Deterministically calculates the discount given a cart subtotal and a rule.
     * @param subtotal Total amount before discount
     * @param rule The single source of truth discount rule
     * @returns structured validation result
     */
    static evaluate(subtotal: number, rule: DiscountRule): PromoValidationResult {
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
        if (rule.type === 'fixed') {
            discount = Number(rule.value);
        } else if (rule.type === 'percentage') {
            discount = Math.floor((subtotal * Number(rule.value)) / 100);
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
