import { Request, Response } from 'express';
import { VoucherService } from '../services/voucher_barcode.service.js';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class VoucherController {
    /**
     * Generate voucher for a given transaction (Stand only)
     */
    static async generate(req: Request, res: Response) {
        try {
            const { transactionId, locationSource } = req.body;
            if (!transactionId || !locationSource) {
                return res.status(400).json({ success: false, message: 'transactionId and locationSource required' });
            }
            const voucher = await VoucherService.generateVoucher(transactionId, locationSource);
            res.json({ success: true, data: voucher });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    /**
     * Validate voucher (POS Outlet use)
     */
    static async validate(req: Request, res: Response) {
        try {
            const code = req.params.code as string;
            const result = await VoucherService.validateVoucher(code);
            res.json({ success: true, ...result });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    /**
     * Redeem voucher (POS Outlet completion)
     */
    static async redeem(req: Request, res: Response) {
        try {
            const { code, locationRedeemed, transactionId } = req.body;
            const voucher = await VoucherService.redeemVoucher(code, locationRedeemed, transactionId);
            res.json({ success: true, data: voucher });
        } catch (e: any) {
            res.status(400).json({ success: false, message: e.message });
        }
    }

    /**
     * Analytics for dashboard
     */
    static async analytics(req: Request, res: Response) {
        try {
            const stats = await VoucherService.getVoucherAnalytics();
            res.json({ success: true, data: stats });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    /**
     * Get voucher generated for a specific transaction (for UI polling after checkout)
     */
    static async getByTransaction(req: Request, res: Response) {
        try {
            const transactionId = parseInt(req.params.transactionId as string);
            if (isNaN(transactionId)) {
                return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
            }
            const [voucher] = await db
                .select()
                .from(schema.standVouchers)
                .where(eq(schema.standVouchers.sourceTransactionId, transactionId))
                .orderBy(schema.standVouchers.createdAt)
                .limit(1);

            if (!voucher) {
                return res.json({ success: true, voucher: null });
            }
            res.json({ success: true, voucher });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
}
