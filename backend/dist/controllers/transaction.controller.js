import { TransactionService } from '../services/transaction.service.js';
export class TransactionController {
    static async getAll(req, res) {
        try {
            const transactions = await TransactionService.getAllTransactions();
            res.json({ success: true, data: transactions });
        }
        catch (error) {
            console.error('--- TransactionController.getAll ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
        }
    }
    static async getOpenBills(req, res) {
        try {
            const bills = await TransactionService.getOpenBills();
            res.json({ success: true, data: bills });
        }
        catch (error) {
            console.error('--- TransactionController.getOpenBills ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal mengambil data bill terbuka' });
        }
    }
    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const transaction = await TransactionService.getTransactionById(id);
            if (!transaction)
                return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
            res.json({ success: true, data: transaction });
        }
        catch (error) {
            console.error('--- TransactionController.getById ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal mengambil detail transaksi' });
        }
    }
    static async checkout(req, res) {
        try {
            const { items } = req.body;
            const userId = req.user?.id || 'anonymous';
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty' });
            }
            const result = await TransactionService.processCheckout(req.body, userId);
            res.status(201).json({
                success: true,
                message: 'Transaksi berhasil diselesaikan',
                data: { transactionId: result.transactionId }
            });
        }
        catch (error) {
            console.error('--- TransactionController.checkout ERROR ---', error.message);
            res.status(500).json({ success: false, message: 'Transaksi gagal: ' + error.message });
        }
    }
    static async addItems(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { items } = req.body;
            const userId = req.user?.id || 'anonymous';
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Items list is empty' });
            }
            const result = await TransactionService.addItemsToTransaction(id, items, userId);
            res.json({ success: true, message: 'Menu berhasil ditambahkan ke bill', data: result });
        }
        catch (error) {
            console.error('--- TransactionController.addItems ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menambahkan menu: ' + error.message });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const adminId = req.user?.id || 'admin';
            await TransactionService.updateTransaction(id, req.body, adminId);
            res.json({ success: true, message: 'Transaksi berhasil diperbarui' });
        }
        catch (error) {
            console.error('--- TransactionController.update ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal memperbarui transaksi: ' + error.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const adminId = req.user?.id || 'admin';
            await TransactionService.deleteTransaction(id, adminId);
            res.json({ success: true, message: 'Transaksi berhasil dihapus (Soft Delete)' });
        }
        catch (error) {
            console.error('--- TransactionController.delete ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menghapus transaksi' });
        }
    }
    static async clearAll(req, res) {
        try {
            const adminId = req.user?.id || 'admin';
            await TransactionService.clearAllTransactions(adminId);
            res.json({ success: true, message: 'Seluruh riwayat transaksi berhasil dihapus' });
        }
        catch (error) {
            console.error('--- TransactionController.clearAll ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menghapus riwayat transaksi' });
        }
    }
    static async merge(req, res) {
        try {
            const { sourceId, sourceIds, targetId } = req.body;
            const userId = req.user?.id || 'anonymous';
            if (!targetId) {
                return res.status(400).json({ success: false, message: 'Target ID is required' });
            }
            // Support both array and single ID
            let finalSourceIds = [];
            if (Array.isArray(sourceIds)) {
                finalSourceIds = sourceIds.map(id => parseInt(id));
            }
            else if (sourceId) {
                finalSourceIds = [parseInt(sourceId)];
            }
            if (finalSourceIds.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one Source ID is required' });
            }
            const result = await TransactionService.mergeBills(finalSourceIds, parseInt(targetId), userId);
            res.json({ success: true, message: 'Bill berhasil digabungkan', data: result });
        }
        catch (error) {
            console.error('--- TransactionController.merge ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal menggabungkan bill: ' + error.message });
        }
    }
    static async split(req, res) {
        try {
            const { sourceId, targetInfo, items } = req.body;
            const userId = req.user?.id || 'anonymous';
            if (!sourceId || !items || !Array.isArray(items)) {
                return res.status(400).json({ success: false, message: 'Source ID and items array are required' });
            }
            const result = await TransactionService.splitBill(parseInt(sourceId), targetInfo, items, userId);
            res.json({ success: true, message: 'Bill berhasil dipisah', data: result });
        }
        catch (error) {
            console.error('--- TransactionController.split ERROR ---', error);
            res.status(500).json({ success: false, message: 'Gagal memisah bill: ' + error.message });
        }
    }
}
