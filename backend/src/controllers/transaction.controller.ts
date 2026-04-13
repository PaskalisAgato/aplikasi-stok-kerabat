import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { IdempotencyService } from '../services/idempotency.service.js';

export class TransactionController {
    // ... (getAll, getOpenBills, getById remain the same)
    static async getAll(req: Request, res: Response) {
        try {
            const transactions = await TransactionService.getAllTransactions();
            res.json({ success: true, data: transactions });
        } catch (error: any) {
            console.error('--- TransactionController.getAll ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
        }
    }

    static async getOpenBills(req: Request, res: Response) {
        try {
            const bills = await TransactionService.getOpenBills();
            res.json({ success: true, data: bills });
        } catch (error: any) {
            console.error('--- TransactionController.getOpenBills ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal mengambil data bill terbuka' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            const transaction = await TransactionService.getTransactionById(id);
            if (!transaction) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
            
            res.json({ success: true, data: transaction });
        } catch (error: any) {
            console.error('--- TransactionController.getById ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal mengambil detail transaksi' });
        }
    }

    static async checkout(req: Request, res: Response) {
        try {
            const { items, paymentMethod, paymentReferenceId, offlineId } = req.body;
            const userId = (req as any).user?.id || 'anonymous';
            
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Keranjang belanja kosong' });
            }

            const result = await TransactionService.processCheckout(req.body, userId);
            
            const responseBody = { 
                success: true, 
                message: 'Transaksi berhasil diselesaikan',
                data: { transactionId: result.transactionId }
            };


            
            res.status(201).json(responseBody);
        } catch (error: any) {
            console.error('--- TransactionController.checkout ERROR ---', error.message);
            res.status(500).json({ success: false, message: 'Transaksi gagal: ' + error.message });
        }
    }

    static async addItems(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const { items } = req.body;
            const userId = (req as any).user?.id || 'anonymous';

            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Items list is empty' });
            }

            const result = await (TransactionService as any).addItemsToTransaction(id, items, userId);
            res.json({ success: true, message: 'Menu berhasil ditambahkan ke bill', data: result });
        } catch (error: any) {
            console.error('--- TransactionController.addItems ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menambahkan menu: ' + error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            const adminId = (req as any).user?.id || 'admin';
            await TransactionService.updateTransaction(id, req.body, adminId);
            res.json({ success: true, message: 'Transaksi berhasil diperbarui' });
        } catch (error: any) {
            console.error('--- TransactionController.update ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi: ' + error.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            const adminId = (req as any).user?.id || 'admin';
            await TransactionService.deleteTransaction(id, adminId);
            res.json({ success: true, message: 'Transaksi berhasil dihapus (Soft Delete)' });
        } catch (error: any) {
            console.error('--- TransactionController.delete ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menghapus transaksi' });
        }
    }

    static async void(req: Request, res: Response) {
        const idempotencyKey = req.headers['x-idempotency-key'] as string;
        try {
            // 1. HARDENING: Server-side Idempotency Cache
            const cached = await IdempotencyService.getCachedResponse(idempotencyKey);
            if (cached) return res.status(cached.statusCode).json(cached.body);

            const id = parseInt(req.params.id as string);
            const { reason, adminPin } = req.body;
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            if (!reason) return res.status(400).json({ error: 'Reason is required for void' });
            
            const userId = (req as any).user?.id || 'admin';
            await TransactionService.voidTransaction(id, reason, userId, adminPin);

            const responseBody = { success: true, message: 'Transaksi berhasil dibatalkan (VOID)' };
            
            // 2. Save for idempotency
            await IdempotencyService.setCachedResponse(idempotencyKey, responseBody, 200);

            res.json(responseBody);
        } catch (error: any) {
            console.error('--- TransactionController.void ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal membatalkan transaksi: ' + error.message });
        }
    }

    static async clearAll(req: Request, res: Response) {
        try {
            const adminId = (req as any).user?.id || 'admin';
            await TransactionService.clearAllTransactions(adminId);
            res.json({ success: true, message: 'Seluruh riwayat transaksi berhasil dihapus' });
        } catch (error: any) {
            console.error('--- TransactionController.clearAll ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menghapus riwayat transaksi' });
        }
    }

    static async merge(req: Request, res: Response) {
        try {
            const { sourceId, sourceIds, targetId } = req.body;
            const userId = (req as any).user?.id || 'anonymous';

            if (!targetId) {
                return res.status(400).json({ success: false, message: 'Target ID is required' });
            }

            // Support both array and single ID
            let finalSourceIds: number[] = [];
            if (Array.isArray(sourceIds)) {
                finalSourceIds = sourceIds.map(id => parseInt(id));
            } else if (sourceId) {
                finalSourceIds = [parseInt(sourceId)];
            }

            if (finalSourceIds.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one Source ID is required' });
            }

            const result = await TransactionService.mergeBills(finalSourceIds, parseInt(targetId), userId);
            res.json({ success: true, message: 'Bill berhasil digabungkan', data: result });
        } catch (error: any) {
            console.error('--- TransactionController.merge ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menggabungkan bill: ' + error.message });
        }
    }

    static async split(req: Request, res: Response) {
        try {
            const { sourceId, targetInfo, items } = req.body;
            const userId = (req as any).user?.id || 'anonymous';

            if (!sourceId || !items || !Array.isArray(items)) {
                return res.status(400).json({ success: false, message: 'Source ID and items array are required' });
            }

            const result = await TransactionService.splitBill(parseInt(sourceId), targetInfo, items, userId);
            res.json({ success: true, message: 'Bill berhasil dipisah', data: result });
        } catch (error: any) {
            console.error('--- TransactionController.split ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal memisah bill: ' + error.message });
        }
    }
}
