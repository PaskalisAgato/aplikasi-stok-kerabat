import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import crypto from 'crypto';

export class VoucherService {
    /**
     * Generate a unique voucher code KKT-XXXXXX
     */
    static generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
        let code = 'KKT-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Create a new voucher for a stand transaction
     */
    static async generateVoucher(transactionId: number, locationSource: number) {
        const code = this.generateCode();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 3); // 3 hours validity

        const [voucher] = await db.insert(schema.standVouchers).values({
            code,
            sourceTransactionId: transactionId,
            benefitType: 'discount',
            discountValue: '20', // Default 20%
            expiresAt,
            locationSource,
            status: 'unused'
        }).returning();

        return voucher;
    }

    /**
     * Validate voucher by code
     */
    static async validateVoucher(code: string) {
        const [voucher] = await db.select().from(schema.standVouchers).where(eq(schema.standVouchers.code, code.toUpperCase())).limit(1);

        if (!voucher) return { valid: false, message: 'Voucher tidak valid' };
        if (voucher.status === 'redeemed') return { valid: false, message: 'Voucher sudah digunakan' };
        if (new Date() > voucher.expiresAt) {
            // Update status to expired if it's not already
            if (voucher.status !== 'expired') {
                await db.update(schema.standVouchers).set({ status: 'expired' }).where(eq(schema.standVouchers.id, voucher.id));
            }
            return { valid: false, message: 'Voucher sudah kadaluwarsa' };
        }

        return { valid: true, voucher };
    }

    /**
     * Redeem a voucher
     */
    static async redeemVoucher(code: string, locationRedeemed: number, transactionId: number) {
        const { valid, voucher, message } = await this.validateVoucher(code);
        if (!valid || !voucher) throw new Error(message || 'Voucher tidak valid');

        const [updated] = await db.update(schema.standVouchers).set({
            status: 'redeemed',
            locationRedeemed,
            redeemedTransactionId: transactionId,
            redeemedAt: new Date()
        }).where(eq(schema.standVouchers.id, voucher.id)).returning();

        return updated;
    }

    /**
     * get analytics for dashboard
     */
    static async getVoucherAnalytics() {
        const total = await db.select({ count: sql<number>`count(*)` }).from(schema.standVouchers);
        const redeemed = await db.select({ count: sql<number>`count(*)` }).from(schema.standVouchers).where(eq(schema.standVouchers.status, 'redeemed'));
        const expired = await db.select({ count: sql<number>`count(*)` }).from(schema.standVouchers).where(eq(schema.standVouchers.status, 'expired'));
        
        const genCount = total[0]?.count || 0;
        const redCount = redeemed[0]?.count || 0;
        const expCount = expired[0]?.count || 0;
        
        return {
            generated: genCount,
            redeemed: redCount,
            expired: expCount,
            conversionRate: genCount > 0 ? (redCount / genCount) * 100 : 0
        };
    }
}
