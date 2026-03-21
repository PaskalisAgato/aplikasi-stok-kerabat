import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/today', requireAuth, AttendanceController.getTodayStatus);
router.post('/check-in', requireAuth, AttendanceController.checkIn);
router.post('/check-out', requireAuth, AttendanceController.checkOut);
router.get('/history', requireAdmin, AttendanceController.getHistory);

export { router as attendanceRoutes };
