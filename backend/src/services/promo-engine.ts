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
    static evaluate(subtotal: number, rule: any): PromoValidationResult {
        if (!rule.active) {
            return { valid: false, reason: "Promo tidak aktif", discountAmount: 0 };
        }

        const now = new Date();
        if (rule.startDate && now < new Date(rule.startDate)) {
            return { valid: false, reason: "Promo belum dimulai", discountAmount: 0 };
        }
        if (rule.endDate && now > new Date(rule.endDate)) {
            return { valid: false, reason: "Promo sudah kadaluarsa", discountAmount: 0 };
        }

        if (rule.usageLimit && rule.usedCount >= rule.usageLimit) {
            return { valid: false, reason: "Batas pemakaian promo sudah habis", discountAmount: 0 };
        }

        const minPurch = Number(rule.minPurchase || 0);
        if (subtotal < minPurch) {
            return { valid: false, reason: `Minimal pembelian Rp ${minPurch.toLocaleString('id-ID')}`, discountAmount: 0 };
        }

        let discount = 0;
        const val = Number(rule.value || 0);
        if (rule.type === 'fixed') {
            discount = val;
        } else if (rule.type === 'percentage') {
            discount = Math.floor((subtotal * val) / 100);
        }

        const cap = rule.maxDiscount ? Number(rule.maxDiscount) : null;
        if (cap !== null && cap > 0 && discount > cap) {
            discount = cap;
        }
        
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
