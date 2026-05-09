import { describe, it, expect } from 'vitest';
import { PromoEngine, DiscountRule } from '../promo-engine';

describe('PromoEngine Evaluator', () => {
    const baseRule: DiscountRule = {
        id: 'uuid-1',
        code: 'PROMO10',
        type: 'fixed',
        value: 10000,
        minPurchase: 0,
        usedCount: 0,
        active: true,
        stackable: false,
        configVersion: 1
    };

    it('should reject inactive promo', () => {
        const rule = { ...baseRule, active: false };
        const result = PromoEngine.evaluate(50000, [], rule);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe("Promo tidak aktif");
    });

    it('should calculate fixed discount correctly', () => {
        const result = PromoEngine.evaluate(50000, [], baseRule);
        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBe(10000);
    });

    it('should cap discount up to subtotal', () => {
        const result = PromoEngine.evaluate(5000, [], baseRule);
        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBe(5000); // Only 5k because subtotal is 5k
    });

    it('should calculate percentage discount correctly', () => {
        const percentRule: DiscountRule = { ...baseRule, type: 'percentage', value: 20 };
        const result = PromoEngine.evaluate(100000, [], percentRule);
        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBe(20000); // 20% of 100k
    });

    it('should apply maximum discount cap for percentage types', () => {
        const capRule: DiscountRule = { ...baseRule, type: 'percentage', value: 20, maxDiscount: 15000 };
        const result = PromoEngine.evaluate(100000, [], capRule);
        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBe(15000); // Capped at 15k instead of 20k
    });

    it('should enforce minimum purchase', () => {
        const minRule: DiscountRule = { ...baseRule, minPurchase: 50000 };
        const result = PromoEngine.evaluate(30000, [], minRule);
        expect(result.valid).toBe(false);
        expect(result.discountAmount).toBe(0);
        expect(result.reason).toContain('Minimal pembelian');
    });

    it('should enforce date limits correctly', () => {
        const oldRule: DiscountRule = { 
            ...baseRule, 
            endDate: new Date(Date.now() - 100000).toISOString() 
        };
        const result = PromoEngine.evaluate(50000, [], oldRule);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe("Promo sudah kadaluarsa");
    });

    it('should enforce usage limits correctly', () => {
        const usageRule: DiscountRule = { ...baseRule, usageLimit: 10, usedCount: 10 };
        const result = PromoEngine.evaluate(50000, [], usageRule);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe("Batas pemakaian promo sudah habis");
    });
    it('should evaluate bundling rule correctly when items map matches', () => {
        const bundleRule: DiscountRule = { 
            ...baseRule, 
            type: 'bundling', 
            // Setting a stringified conditions with flatPrice 15000
            conditions: JSON.stringify({ productIds: [1, 2], flatPrice: 15000 })
        };
        
        const itemsList = [
            { recipeId: 1, quantity: 1, price: 10000 },
            { recipeId: 2, quantity: 1, price: 12000 }, // Total original bundle value 22000
        ];
        // 22000 - 15000 = 7000 discount
        const result = PromoEngine.evaluate(22000, itemsList, bundleRule);
        
        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBe(7000);
    });

    it('should reject bundling if an item is missing', () => {
        const bundleRule: DiscountRule = { 
            ...baseRule, 
            type: 'bundling', 
            conditions: JSON.stringify({ productIds: [1, 2], flatPrice: 15000 })
        };
        
        const itemsList = [
            { recipeId: 1, quantity: 1, price: 10000 } // Missing recipeId 2
        ];
        const result = PromoEngine.evaluate(10000, itemsList, bundleRule);
        
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Item bundle belum lengkap dibeli');
    });
});
