import { Router } from 'express';
import { CashierShiftController } from '../controllers/cashierShift.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/active', CashierShiftController.getActiveShift);
router.post('/open', CashierShiftController.openShift);
router.get('/summary/:id', CashierShiftController.getShiftSummary);
router.post('/close/:id', CashierShiftController.closeShift);

export { router as cashierShiftRoutes };
