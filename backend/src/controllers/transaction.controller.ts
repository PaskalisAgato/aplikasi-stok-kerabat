import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';

export class TransactionController {
    static async getAll(req: Request, res: Response) {
        try {
            const transactions = await TransactionService.getAllTransactions();
            res.json(transactions);
        } catch (error: any) {
            console.error('--- TransactionController.getAll ERROR ---', error);
            res.status(500).json({ error: 'Failed to fetch transactions', detail: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            const transaction = await TransactionService.getTransactionById(id);
            if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
            
            res.json(transaction);
        } catch (error: any) {
            console.error('--- TransactionController.getById ERROR ---', error);
            res.status(500).json({ error: 'Failed to fetch transaction', detail: error.message });
        }
    }

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

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            const adminId = (req as any).user?.id || 'admin';
            await TransactionService.updateTransaction(id, req.body, adminId);
            
            res.json({ success: true, message: 'Transaction updated successfully' });
        } catch (error: any) {
            console.error('--- TransactionController.update ERROR ---', error);
            res.status(500).json({ error: 'Failed to update transaction', detail: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            const adminId = (req as any).user?.id || 'admin';
            await TransactionService.deleteTransaction(id, adminId);
            
            res.json({ success: true, message: 'Transaction deleted successfully' });
        } catch (error: any) {
            console.error('--- TransactionController.delete ERROR ---', error);
            res.status(500).json({ error: 'Failed to delete transaction', detail: error.message });
        }
    }
}
