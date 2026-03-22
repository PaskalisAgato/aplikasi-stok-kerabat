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
            const record = await AttendanceService.checkIn(userId);
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
            const record = await AttendanceService.checkOut(userId);
            res.json(record);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getHistory(req, res) {
        try {
            const { userId, startDate, endDate, name } = req.query;
            const history = await AttendanceService.getHistory({
                userId: userId,
                startDate: startDate,
                endDate: endDate,
                name: name
            });
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
