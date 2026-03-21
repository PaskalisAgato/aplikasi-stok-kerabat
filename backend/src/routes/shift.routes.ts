import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAdmin, ShiftController.getAllShifts);
router.get('/my', requireAuth, ShiftController.getMyShifts);
router.post('/', requireAdmin, ShiftController.createShift);
router.put('/:id', requireAdmin, ShiftController.updateShift);
router.delete('/:id', requireAdmin, ShiftController.deleteShift);

export { router as shiftRoutes };
