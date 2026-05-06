import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { VoucherController } from '../controllers/voucher.controller.js';

const router = Router();

// POS Stand: Generate QR
router.post('/generate', requireAuth, VoucherController.generate);

// POS Outlet: Scan/Validate QR
router.get('/validate/:code', requireAuth, VoucherController.validate);

// POS Outlet: Consume QR
router.post('/redeem', requireAuth, VoucherController.redeem);

// Admin Dashboard: Tracking
router.get('/analytics', requireAdmin, VoucherController.analytics);

// POS: Get voucher generated for a specific transactionId
router.get('/by-transaction/:transactionId', requireAuth, VoucherController.getByTransaction);

export { router as voucherRoutes };
