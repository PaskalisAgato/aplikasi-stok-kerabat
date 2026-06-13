import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { VoucherPromoController } from '../controllers/voucher_promo.controller.js';

const router = Router();

// Stats & Dashboard
router.get('/stats', requireAdmin, VoucherPromoController.getStats);

// Templates
router.get('/templates', requireAdmin, VoucherPromoController.getTemplates);
router.post('/templates', requireAdmin, VoucherPromoController.createTemplate);

// Generation
router.post('/generate', requireAdmin, VoucherPromoController.generateBatch);

// History
router.get('/batches', requireAdmin, VoucherPromoController.getBatches);
router.get('/batches/:id/vouchers', requireAdmin, VoucherPromoController.getBatchVouchers);

// Delete batch & individual voucher
router.delete('/batches/:id', requireAdmin, VoucherPromoController.deleteBatch);
router.delete('/vouchers/:id', requireAdmin, VoucherPromoController.deleteVoucher);

// Analytics & Security
router.get('/analytics', requireAdmin, VoucherPromoController.getAnalytics);
router.post('/redeem', requireAuth, VoucherPromoController.redeemVoucher);

export { router as voucherPromoRoutes };
