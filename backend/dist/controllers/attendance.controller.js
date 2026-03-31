import { AttendanceService } from '../services/attendance.service.js';
import fs from 'fs';
import path from 'path';
import { resizeImage } from '../utils/image.utils.js';
export class AttendanceController {
    static async upload(req, res) {
        try {
            if (!req.file)
                throw new Error('No file uploaded');
            const filename = req.file.filename;
            // Process image in background (optional, but here we do it before response for simplicity)
            await resizeImage(req.file.path, 1200, 70);
            res.json({ success: true, filename });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getTodayStatus(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: 'Unauthorized' });
            const status = await AttendanceService.getTodayAttendance(userId);
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async checkIn(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: 'Unauthorized' });
            const { latitude, longitude, location } = req.body;
            const photoPath = req.file ? `attendance/${req.file.filename}` : undefined;
            const record = await AttendanceService.checkIn(userId, photoPath, {
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                location
            });
            res.json(record);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async checkOut(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: 'Unauthorized' });
            const { latitude, longitude, location } = req.body;
            const photoPath = req.file ? `attendance/${req.file.filename}` : undefined;
            const record = await AttendanceService.checkOut(userId, photoPath, {
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                location
            });
            res.json(record);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getHistory(req, res) {
        try {
            const { userId, startDate, endDate, name, limit = '100', page = '1' } = req.query;
            const history = await AttendanceService.getHistory({
                userId: userId,
                startDate: startDate,
                endDate: endDate,
                name: name
            });
            res.json({
                success: true,
                data: history,
                meta: {
                    total: history.length,
                    limit: parseInt(limit),
                    page: parseInt(page)
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async viewOnce(req, res) {
        try {
            const filename = req.params.filename;
            const filePath = path.resolve(process.cwd(), 'uploads', 'attendance', filename);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Foto tidak ditemukan atau sudah dihapus.' });
            }
            // Stream and then delete
            res.sendFile(filePath, async (err) => {
                if (err) {
                    console.error('File stream error:', err);
                }
                else {
                    // Success, now delete
                    try {
                        // 1. Delete file
                        fs.unlinkSync(filePath);
                        console.log(`[ViewOnce] Deleted file: ${filename}`);
                        // 2. Clear URL in DB
                        await AttendanceService.clearPhotoUrl(filename);
                        console.log(`[ViewOnce] Cleared DB URL: ${filename}`);
                    }
                    catch (unlinkErr) {
                        console.error('Failed to cleanup after view:', unlinkErr);
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async deleteRecord(req, res) {
        try {
            const id = req.params.id;
            const record = await AttendanceService.deleteRecord(id);
            res.json({ success: true, record });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async deleteByRange(req, res) {
        try {
            const { startDate, endDate } = req.body;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and End date are required' });
            }
            const result = await AttendanceService.deleteByRange(startDate, endDate);
            res.json({ success: true, ...result });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
