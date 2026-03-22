import { TransactionService } from '../services/transaction.service.js';
export class TransactionController {
    static async getAll(req, res) {
        try {
            const transactions = await TransactionService.getAllTransactions();
            res.json(transactions);
        }
        catch (error) {
            console.error('--- TransactionController.getAll ERROR ---', error);
            res.status(500).json({ error: 'Failed to fetch transactions', detail: error.message });
        }
    }
    static async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const transaction = await TransactionService.getTransactionById(id);
            if (!transaction)
                return res.status(404).json({ error: 'Transaction not found' });
            res.json(transaction);
        }
        catch (error) {
            console.error('--- TransactionController.getById ERROR ---', error);
            res.status(500).json({ error: 'Failed to fetch transaction', detail: error.message });
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
                message: 'Checkout completed successfully',
                transactionId: result.transactionId
            });
        }
        catch (error) {
            console.error('--- TransactionController.checkout ERROR ---');
            console.error(error.message);
            res.status(500).json({ error: 'Transaction Failed', detail: error.message });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const adminId = req.user?.id || 'admin';
            await TransactionService.updateTransaction(id, req.body, adminId);
            res.json({ success: true, message: 'Transaction updated successfully' });
        }
        catch (error) {
            console.error('--- TransactionController.update ERROR ---', error);
            res.status(500).json({ error: 'Failed to update transaction', detail: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const adminId = req.user?.id || 'admin';
            await TransactionService.deleteTransaction(id, adminId);
            res.json({ success: true, message: 'Transaction deleted successfully' });
        }
        catch (error) {
            console.error('--- TransactionController.delete ERROR ---', error);
            res.status(500).json({ error: 'Failed to delete transaction', detail: error.message });
        }
    }
}
