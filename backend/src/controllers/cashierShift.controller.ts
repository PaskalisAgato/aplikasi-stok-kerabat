import { Request, Response } from 'express';
import { CashierShiftService } from '../services/cashierShift.service.js';

export class CashierShiftController {
    static async getActiveShift(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const shift = await CashierShiftService.getActiveShift(userId);
            res.json({ success: true, data: shift });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async openShift(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { initialCash } = req.body;
            
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            if (initialCash === undefined) return res.status(400).json({ error: 'Initial cash is required' });

            const shift = await CashierShiftService.openShift(userId, parseFloat(initialCash));
            res.status(201).json({ success: true, data: shift });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getShiftSummary(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid shift ID' });

            const summary = await CashierShiftService.getShiftSummary(id);
            res.json({ success: true, data: summary });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async closeShift(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const id = parseInt(req.params.id as string);
            const { actualCash, actualNonCash, notes } = req.body;

            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid shift ID' });
            if (actualCash === undefined || actualNonCash === undefined) {
                return res.status(400).json({ error: 'Actual cash and non-cash amounts are required' });
            }

            const result = await CashierShiftService.closeShift(id, {
                actualCash: parseFloat(actualCash),
                actualNonCash: parseFloat(actualNonCash),
                notes: notes || '',
                userId
            });

            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
