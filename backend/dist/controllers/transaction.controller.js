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
}
