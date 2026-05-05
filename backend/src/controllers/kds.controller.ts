import { Request, Response } from 'express';
import { KdsService } from '../services/kds.service.js';

export class KdsController {
    /**
     * SSE Event Stream for KDS
     */
    static async getEvents(req: Request, res: Response) {
        const outletId = parseInt(req.query.outletId as string);
        if (isNaN(outletId)) {
            return res.status(400).json({ success: false, message: 'outletId required' });
        }

        const clientId = `kds-${outletId}-${Date.now()}`;
        
        KdsService.addClient(clientId, outletId, res);

        // Handle connection close
        req.on('close', () => {
            KdsService.removeClient(clientId);
        });
    }

    /**
     * Endpoint to manually trigger a KDS update (mostly for debugging or retry)
     */
    static async poke(req: Request, res: Response) {
        const { outletId, orderData } = req.body;
        KdsService.notifyNewOrder(outletId, orderData);
        res.json({ success: true });
    }
}
