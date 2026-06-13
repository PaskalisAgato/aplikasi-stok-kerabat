import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { VoucherService } from './voucher_barcode.service.js';
import crypto from 'crypto';

const VOUCHER_SECRET = process.env.VOUCHER_SECRET || 'stok-kerabat-premium-secret-2026';

export class VoucherPromoService {
    /**
     * Create a new voucher template
     */
    static async createTemplate(data: any) {
        const [template] = await db.insert(schema.voucherTemplates).values({
            name: data.name,
            backgroundImageUrl: data.backgroundImageUrl,
            qrConfig: JSON.stringify(data.qrConfig || { x: 0, y: 0, size: 100 }),
            textConfig: JSON.stringify(data.textConfig || {}),
            outletId: data.outletId || 1
        }).returning();
        return template;
    }

    /**
     * Get all voucher templates
     */
    static async getTemplates(outletId: number = 1) {
        return db.select()
            .from(schema.voucherTemplates)
            .where(eq(schema.voucherTemplates.outletId, outletId))
            .orderBy(desc(schema.voucherTemplates.createdAt));
    }

    /**
     * sign a code with a short HMAC suffix
     */
    static signCode(code: string) {
        const hmac = crypto.createHmac('sha256', VOUCHER_SECRET);
        hmac.update(code);
        const signature = hmac.digest('hex').toUpperCase().slice(0, 2);
        return `${code}-${signature}`;
    }

    /**
     * verify if a signed code is valid
     */
    static verifyCode(fullCode: string) {
        const parts = fullCode.split('-');
        if (parts.length < 3) return false; // KKT-XXXXXX-SS
        const signature = parts.pop();
        const baseCode = parts.join('-');
        return this.signCode(baseCode) === fullCode;
    }

    /**
     * Bulk generate vouchers with HMAC signatures
     */
    static async generateBatch(data: {
        templateId?: string,
        promoName: string,
        quantity: number,
        menuName?: string,
        normalPrice?: string,
        voucherPrice?: string,
        discountNominal?: string,
        expiryDays?: number,
        createdBy: string
    }) {
        const { templateId, promoName, quantity, menuName, normalPrice, voucherPrice, discountNominal, expiryDays = 30, createdBy } = data;

        // Sanitize templateId: only use if it's a valid UUID format, otherwise null
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validTemplateId = templateId && UUID_REGEX.test(templateId) ? templateId : null;

        // 1. Create Batch record
        const [batch] = await db.insert(schema.promoVoucherBatches).values({
            templateId: validTemplateId as any,
            promoName,
            quantity,
            createdBy
        }).returning();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        // 2. Generate unique codes and bulk insert
        const vouchersToInsert = [];
        const usedCodes = new Set<string>();

        for (let i = 0; i < quantity; i++) {
            let baseCode = '';
            let attempt = 0;
            do {
                baseCode = VoucherService.generateCode(); // KKT-XXXXXX
                attempt++;
            } while (usedCodes.has(baseCode) && attempt < 10);
            
            usedCodes.add(baseCode);
            const signedCode = this.signCode(baseCode);

            vouchersToInsert.push({
                batchId: batch.id,
                code: signedCode,
                status: 'unused',
                menuName,
                normalPrice,
                voucherPrice,
                discountNominal,
                expiresAt
            });

            if (vouchersToInsert.length >= 100) {
                await db.insert(schema.promoVouchers).values(vouchersToInsert as any);
                vouchersToInsert.length = 0;
            }
        }

        if (vouchersToInsert.length > 0) {
            await db.insert(schema.promoVouchers).values(vouchersToInsert as any);
        }

        return { batch, quantity };
    }

    /**
     * Non-destructive validation for POS evaluation
     */
    static async validateVoucher(code: string, tx?: any) {
        if (!this.verifyCode(code)) {
            return { valid: false, message: 'Invalid signature' };
        }

        const baseDb = tx || db;
        const [voucher] = await baseDb.select()
            .from(schema.promoVouchers)
            .where(eq(schema.promoVouchers.code, code))
            .limit(1);

        if (!voucher) return { valid: false, message: 'Voucher not found' };
        if (voucher.status !== 'unused') return { valid: false, message: `Voucher sudah ${voucher.status}` };
        
        if (new Date() > new Date(voucher.expiresAt)) {
            return { valid: false, message: 'Voucher sudah kadaluwarsa' };
        }

        return { valid: true, voucher };
    }

    /**
     * Mark a voucher as redeemed
     */
    static async redeemVoucher(code: string, transactionId: number, tx?: any) {
        const vCheck = await this.validateVoucher(code, tx);
        if (!vCheck.valid || !vCheck.voucher) {
            throw new Error(vCheck.message || 'Gagal memvalidasi voucher');
        }

        const voucher = vCheck.voucher;
        const baseDb = tx || db;

        // 2. Atomic Redemption
        const [updated] = await baseDb.update(schema.promoVouchers)
            .set({ 
                status: 'redeemed',
                redeemedAt: new Date(),
                redeemedTransactionId: transactionId
            })
            .where(and(
                eq(schema.promoVouchers.id, voucher.id),
                eq(schema.promoVouchers.status, 'unused')
            ))
            .returning();

        if (!updated) throw new Error('Voucher gagal di-redeem (kemungkinan sudah terpakai di transaksi lain).');

        return updated;
    }

    /**
     * Get basic stats for marketing vouchers
     */
    static async getVoucherStats() {
        const [totalStats] = await db.select({
            total: sql<number>`count(*)`,
            redeemed: sql<number>`count(*) filter (where ${schema.promoVouchers.status} = 'redeemed')`,
            expired: sql<number>`count(*) filter (where ${schema.promoVouchers.status} = 'expired')`,
            unused: sql<number>`count(*) filter (where ${schema.promoVouchers.status} = 'unused')`
        }).from(schema.promoVouchers);

        return {
            total: Number(totalStats.total || 0),
            redeemed: Number(totalStats.redeemed || 0),
            expired: Number(totalStats.expired || 0),
            unused: Number(totalStats.unused || 0),
            conversionRate: totalStats.total > 0 ? (Number(totalStats.redeemed) / Number(totalStats.total)) * 100 : 0
        };
    }

    /**
     * Get specific vouchers in a batch
     */
    static async getBatchVouchers(batchId: string) {
        return db.select()
            .from(schema.promoVouchers)
            .where(eq(schema.promoVouchers.batchId, batchId as any))
            .orderBy(schema.promoVouchers.createdAt);
    }

    /**
     * Get recent batches
     */
    static async getRecentBatches() {
        return db.select()
            .from(schema.promoVoucherBatches)
            .orderBy(desc(schema.promoVoucherBatches.createdAt))
            .limit(10);
    }

    /**
     * Delete a batch and all its associated vouchers
     */
    static async deleteBatch(batchId: string) {
        // First delete all child vouchers (no cascade defined in schema)
        await db.delete(schema.promoVouchers)
            .where(eq(schema.promoVouchers.batchId, batchId as any));
        // Then delete the batch itself
        await db.delete(schema.promoVoucherBatches)
            .where(eq(schema.promoVoucherBatches.id, batchId as any));
    }

    /**
     * Delete an individual voucher by ID
     */
    static async deleteVoucher(voucherId: string) {
        await db.delete(schema.promoVouchers)
            .where(eq(schema.promoVouchers.id, voucherId as any));
    }

    /**
     * Get advanced analytics for marketing
     */
    static async getVoucherAnalytics() {
        const stats = await this.getVoucherStats();
        
        // Distribution of redemptions over time (Last 30 days)
        const dailyRedemptions = await db.select({
            date: sql<string>`DATE(${schema.promoVouchers.redeemedAt})`,
            count: sql<number>`count(*)`
        })
        .from(schema.promoVouchers)
        .where(and(
            eq(schema.promoVouchers.status, 'redeemed'),
            sql`${schema.promoVouchers.redeemedAt} > now() - interval '30 days'`
        ))
        .groupBy(sql`DATE(${schema.promoVouchers.redeemedAt})`)
        .orderBy(sql`DATE(${schema.promoVouchers.redeemedAt})`);

        // Revenue Impact (Sum of transaction totals where these vouchers were used)
        const revenueImpact = await db.select({
            totalRevenue: sql<number>`sum(${schema.sales.totalAmount})`,
            totalDiscountUsed: sql<number>`sum(${schema.promoVouchers.discountNominal})`
        })
        .from(schema.promoVouchers)
        .innerJoin(schema.sales, eq(schema.promoVouchers.redeemedTransactionId, schema.sales.id))
        .where(eq(schema.promoVouchers.status, 'redeemed'));

        return {
            overview: stats,
            dailyRedemptions,
            impact: {
                totalRevenue: Number(revenueImpact[0]?.totalRevenue || 0),
                totalDiscountGiven: Number(revenueImpact[0]?.totalDiscountUsed || 0),
                roi: impactROI(revenueImpact[0])
            }
        };
    }
}

function impactROI(data: any) {
    const rev = Number(data?.totalRevenue || 0);
    const disc = Number(data?.totalDiscountUsed || 0);
    if (disc === 0) return 0;
    return (rev / disc).toFixed(2);
}
