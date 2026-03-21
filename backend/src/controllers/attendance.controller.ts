import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
    static async getTodayStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const status = await AttendanceService.getTodayAttendance(userId);
            res.json(status);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async checkIn(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const record = await AttendanceService.checkIn(userId);
            res.json(record);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async checkOut(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const record = await AttendanceService.checkOut(userId);
            res.json(record);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getHistory(req: Request, res: Response) {
        try {
            const { userId, startDate, endDate, name } = req.query;
            const history = await AttendanceService.getHistory({ 
                userId: userId as string, 
                startDate: startDate as string, 
                endDate: endDate as string, 
                name: name as string 
            });
            res.json(history);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
