import { Request, Response } from 'express';
import { ShiftService } from '../services/shift.service';

export class ShiftController {
    static async getAllShifts(req: Request, res: Response) {
        try {
            const shifts = await ShiftService.getAllShifts();
            res.json(shifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getMyShifts(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const shifts = await ShiftService.getShiftsByUser(userId);
            res.json(shifts);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const { userId, date, startTime, endTime } = req.body;
            
            const newShift = await ShiftService.createShift(userId, new Date(date), startTime, endTime, currentUserId);
            res.status(201).json(newShift);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async updateShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const id = req.params.id as string;
            const updatedShift = await ShiftService.updateShift(parseInt(id), req.body, currentUserId);
            res.json(updatedShift);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const id = req.params.id as string;
            await ShiftService.deleteShift(parseInt(id), currentUserId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
