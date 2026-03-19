import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';

export class TransactionController {
    static async checkout(req: Request, res: Response) {
        try {
            const { items } = req.body;
            const userId = (req as any).user?.id || 'anonymous';
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty' });
            }

            const result = await TransactionService.processCheckout(req.body, userId);
            res.status(201).json({ 
                success: true, 
                message: 'Checkout completed successfully',
                transactionId: result.transactionId 
            });
        } catch (error: any) {
            console.error('--- TransactionController.checkout ERROR ---');
            console.error(error.message);
            res.status(500).json({ error: 'Transaction Failed', detail: error.message });
        }
    }
}
