import { AttendanceService } from '../services/attendance.service.js';
export class AttendanceController {
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
            const { latitude, longitude, location, photo } = req.body;
            // photo is already a Cloudinary URL if uploaded via middleware
            const record = await AttendanceService.checkIn(userId, photo, {
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
            const { latitude, longitude, location, photo } = req.body;
            const record = await AttendanceService.checkOut(userId, photo, {
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
        // With Cloudinary, we just return the URL, but the frontend should handle redirects.
        res.status(410).json({ error: 'Endpoint ini sudah tidak digunakan. Foto disimpan di Cloudinary.' });
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
