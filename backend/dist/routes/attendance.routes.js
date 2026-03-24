import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = Router();
// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/attendance';
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `attendance-${userId}-${uniqueSuffix}${path.extname(file.originalname || '.jpg')}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
router.get('/today', requireAuth, AttendanceController.getTodayStatus);
router.post('/check-in', requireAuth, upload.single('photo'), AttendanceController.checkIn);
router.post('/check-out', requireAuth, upload.single('photo'), AttendanceController.checkOut);
router.get('/history', requireAdmin, AttendanceController.getHistory);
router.get('/view-once/:filename', requireAdmin, AttendanceController.viewOnce);
router.delete('/bulk-delete', requireAdmin, AttendanceController.deleteByRange);
router.delete('/:id', requireAdmin, AttendanceController.deleteRecord);
export { router as attendanceRoutes };
