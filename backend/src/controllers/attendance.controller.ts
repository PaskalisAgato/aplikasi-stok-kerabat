import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import fs from 'fs';
import path from 'path';

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
            
            const photoPath = req.file ? `attendance/${req.file.filename}` : undefined;
            const record = await AttendanceService.checkIn(userId, photoPath);
            res.json(record);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async checkOut(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const photoPath = req.file ? `attendance/${req.file.filename}` : undefined;
            const record = await AttendanceService.checkOut(userId, photoPath);
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

    static async viewOnce(req: Request, res: Response) {
        try {
            const filename = req.params.filename as string;
            const filePath = path.resolve(process.cwd(), 'uploads', 'attendance', filename);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Foto tidak ditemukan atau sudah dihapus.' });
            }

            // Stream and then delete
            res.sendFile(filePath, (err) => {
                if (err) {
                    console.error('File stream error:', err);
                } else {
                    // Success, now delete
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`[ViewOnce] Deleted: ${filename}`);
                    } catch (unlinkErr) {
                        console.error('Failed to unlink file:', unlinkErr);
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
