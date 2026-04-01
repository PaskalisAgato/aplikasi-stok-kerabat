import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';

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
            
            const { latitude, longitude, location, photo } = req.body;
            // photo is already a Cloudinary URL if uploaded via middleware
            
            const record = await AttendanceService.checkIn(userId, photo, {
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                location
            });
            res.json(record);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async checkOut(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const { latitude, longitude, location, photo } = req.body;
            
            const record = await AttendanceService.checkOut(userId, photo, {
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                location
            });
            res.json(record);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getHistory(req: Request, res: Response) {
        try {
            const { userId, startDate, endDate, name, limit = '100', page = '1' } = req.query;
            const history = await AttendanceService.getHistory({ 
                userId: userId as string, 
                startDate: startDate as string, 
                endDate: endDate as string, 
                name: name as string 
            });
            res.json({
                success: true,
                data: history,
                meta: { 
                    total: history.length, 
                    limit: parseInt(limit as string), 
                    page: parseInt(page as string) 
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async viewOnce(req: Request, res: Response) {
         // With Cloudinary, we just return the URL, but the frontend should handle redirects.
         res.status(410).json({ error: 'Endpoint ini sudah tidak digunakan. Foto disimpan di Cloudinary.' });
    }

    static async deleteRecord(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const record = await AttendanceService.deleteRecord(id);
            res.json({ success: true, record });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteByRange(req: Request, res: Response) {
        try {
            const { startDate, endDate } = req.body;
            if (!startDate || !endDate) {
                return res.status(400).json({ error: 'Start date and End date are required' });
            }
            const result = await AttendanceService.deleteByRange(startDate, endDate);
            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
