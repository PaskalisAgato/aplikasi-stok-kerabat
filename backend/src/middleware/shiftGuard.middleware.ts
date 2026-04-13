import { Request, Response, NextFunction } from 'express';
import { getSessionManually } from '../lib/session.js';
import { CashierShiftService } from '../services/cashierShift.service.js';

export const shiftGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionData = await getSessionManually(req);
        if (!sessionData?.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const activeShift = await CashierShiftService.getActiveShift(sessionData.user.id);
        if (!activeShift) {
            return res.status(403).json({ 
                success: false, 
                error: 'Shift belum dibuka. Transaksi atau aksi kasir ini ditolak. Silakan buka shift terlebih dahulu.' 
            });
        }

        // Attach shift to request for downstream use
        (req as any).activeShift = activeShift;
        next();
    } catch (err: any) {
        return res.status(500).json({ success: false, error: 'Shift Guard Error: ' + err.message });
    }
};
