import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAdmin, ShiftController.getAllShifts);
router.get('/export-template', requireAdmin, ShiftController.exportShiftTemplate);
router.get('/my', requireAuth, ShiftController.getMyShifts);
router.post('/batch', requireAdmin, ShiftController.batchSave);
router.post('/', requireAdmin, ShiftController.createShift);
router.put('/:id', requireAdmin, ShiftController.updateShift);
router.delete('/:id', requireAdmin, ShiftController.deleteShift);

export { router as shiftRoutes };
