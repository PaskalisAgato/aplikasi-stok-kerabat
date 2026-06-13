import { Request, Response } from 'express';
import { VoucherPromoService } from '../services/voucher_promo.service.js';

export class VoucherPromoController {
    static async getStats(req: Request, res: Response) {
        try {
            const stats = await VoucherPromoService.getVoucherStats();
            res.json({ success: true, data: stats });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async getTemplates(req: Request, res: Response) {
        try {
            const templates = await VoucherPromoService.getTemplates();
            res.json({ success: true, data: templates });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async createTemplate(req: Request, res: Response) {
        try {
            const template = await VoucherPromoService.createTemplate(req.body);
            res.status(201).json({ success: true, data: template });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async generateBatch(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || 'system';
            const result = await VoucherPromoService.generateBatch({
                ...req.body,
                createdBy: userId
            });
            res.status(201).json({ success: true, data: result });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async getBatches(req: Request, res: Response) {
        try {
            const batches = await VoucherPromoService.getRecentBatches();
            res.json({ success: true, data: batches });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async getBatchVouchers(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const vouchers = await VoucherPromoService.getBatchVouchers(id as string);
            res.json({ success: true, data: vouchers });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async getAnalytics(req: Request, res: Response) {
        try {
            const analytics = await VoucherPromoService.getVoucherAnalytics();
            res.json({ success: true, data: analytics });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async redeemVoucher(req: Request, res: Response) {
        try {
            const { code, transactionId } = req.body;
            const result = await VoucherPromoService.redeemVoucher(code, transactionId);
            res.json({ success: true, data: result });
        } catch (e: any) {
            res.status(400).json({ success: false, message: e.message });
        }
    }

    static async deleteBatch(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            await VoucherPromoService.deleteBatch(id);
            res.json({ success: true, message: 'Batch voucher berhasil dihapus' });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }

    static async deleteVoucher(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            await VoucherPromoService.deleteVoucher(id);
            res.json({ success: true, message: 'Voucher berhasil dihapus' });
        } catch (e: any) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
}
