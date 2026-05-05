import { VoucherService } from '../services/voucher_barcode.service.js';
export class VoucherController {
    /**
     * Generate voucher for a given transaction (Stand only)
     */
    static async generate(req, res) {
        try {
            const { transactionId, locationSource } = req.body;
            if (!transactionId || !locationSource) {
                return res.status(400).json({ success: false, message: 'transactionId and locationSource required' });
            }
            const voucher = await VoucherService.generateVoucher(transactionId, locationSource);
            res.json({ success: true, data: voucher });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
    /**
     * Validate voucher (POS Outlet use)
     */
    static async validate(req, res) {
        try {
            const code = req.params.code;
            const result = await VoucherService.validateVoucher(code);
            res.json({ success: true, ...result });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
    /**
     * Redeem voucher (POS Outlet completion)
     */
    static async redeem(req, res) {
        try {
            const { code, locationRedeemed, transactionId } = req.body;
            const voucher = await VoucherService.redeemVoucher(code, locationRedeemed, transactionId);
            res.json({ success: true, data: voucher });
        }
        catch (e) {
            res.status(400).json({ success: false, message: e.message });
        }
    }
    /**
     * Analytics for dashboard
     */
    static async analytics(req, res) {
        try {
            const stats = await VoucherService.getVoucherAnalytics();
            res.json({ success: true, data: stats });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    }
}
