import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/today', requireAuth, AttendanceController.getTodayStatus);
router.post('/check-in', requireAuth, AttendanceController.checkIn);
router.post('/check-out', requireAuth, AttendanceController.checkOut);
router.get('/history', requireAdmin, AttendanceController.getHistory);
export { router as attendanceRoutes };
