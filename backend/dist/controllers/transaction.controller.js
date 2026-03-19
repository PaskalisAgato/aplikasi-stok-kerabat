"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
class TransactionController {
    static async checkout(req, res) {
        try {
            const { items } = req.body;
            const userId = req.user?.id || 'anonymous';
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Cart is empty' });
            }
            const result = await transaction_service_1.TransactionService.processCheckout(req.body, userId);
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
}
exports.TransactionController = TransactionController;
