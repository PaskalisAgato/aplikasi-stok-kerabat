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
            
            const { latitude, longitude, location } = req.body;
            const photoPath = req.file ? `attendance/${req.file.filename}` : undefined;
            
            const record = await AttendanceService.checkIn(userId, photoPath, {
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
            
            const { latitude, longitude, location } = req.body;
            const photoPath = req.file ? `attendance/${req.file.filename}` : undefined;
            
            const record = await AttendanceService.checkOut(userId, photoPath, {
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
        try {
            const filename = req.params.filename as string;
            const filePath = path.resolve(process.cwd(), 'uploads', 'attendance', filename);
            
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Foto tidak ditemukan atau sudah dihapus.' });
            }

            // Stream and then delete
            res.sendFile(filePath, async (err) => {
                if (err) {
                    console.error('File stream error:', err);
                } else {
                    // Success, now delete
                    try {
                        // 1. Delete file
                        fs.unlinkSync(filePath);
                        console.log(`[ViewOnce] Deleted file: ${filename}`);
                        
                        // 2. Clear URL in DB
                        await AttendanceService.clearPhotoUrl(filename);
                        console.log(`[ViewOnce] Cleared DB URL: ${filename}`);
                    } catch (unlinkErr) {
                        console.error('Failed to cleanup after view:', unlinkErr);
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
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
