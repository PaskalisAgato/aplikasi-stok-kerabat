import { Request, Response } from 'express';
import { CashierShiftService } from '../services/cashierShift.service.js';
import { UserService } from '../services/user.service.js';

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
            const { denominations, actualNonCash, notes, nonCashVerified } = req.body;
            
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid shift ID' });
            if (actualNonCash === undefined) {
                return res.status(400).json({ error: 'Actual non-cash amount is required' });
            }

            const result = await CashierShiftService.closeShift(id, {
                denominations: denominations || [],
                actualNonCash: parseFloat(actualNonCash),
                notes: notes || '',
                userId,
                nonCashVerified: !!nonCashVerified
            });

            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async handoverShift(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { currentShiftId, cashAmount, nextCashierName, adminPin } = req.body;

            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            if (!currentShiftId || !cashAmount || !nextCashierName || !adminPin) {
                return res.status(400).json({ error: 'Missing required fields for handover' });
            }
            
            // 1. Verify Admin PIN (Acting as Supervisor)
            const admin = await UserService.loginByPin('Admin', adminPin);
            if (!admin) {
                return res.status(403).json({ success: false, message: 'PIN Admin tidak valid. Handover membutuhkan otoritas Supervisor.' });
            }

            // 2. Resolve Next Cashier User ID
            const allUsers = await UserService.getAllUsers();
            const nextCashier = allUsers.find(u => u.name === nextCashierName);
            if (!nextCashier) {
                return res.status(400).json({ success: false, message: `Kasir penerima "${nextCashierName}" tidak ditemukan di database.` });
            }

            // 3. Perform Handover
            const result = await CashierShiftService.handoverShift(
                Number(currentShiftId),
                nextCashier.id,
                parseFloat(cashAmount),
                userId,     // Approved by 1: Outgoing Cashier
                admin.id    // Approved by 2: Admin/Supervisor
            );

            res.json({ success: true, data: result });
        } catch (error: any) {
            console.error('[Handover Error]:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async deleteShift(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            const id = parseInt(req.params.id as string);
            
            if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid shift ID' });

            const result = await CashierShiftService.deleteShift(id, currentUserId);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
