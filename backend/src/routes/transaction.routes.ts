import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, TransactionController.getAll);
router.get('/open-bills', requireAuth, TransactionController.getOpenBills);
router.get('/:id', requireAuth, TransactionController.getById);
router.post('/', requireAuth, TransactionController.checkout);
router.post('/:id/add-items', requireAuth, TransactionController.addItems);
router.post('/:id/void', requireAuth, TransactionController.void);
router.put('/:id', requireAdmin, TransactionController.update);
router.post('/merge', requireAuth, TransactionController.merge);
router.post('/split', requireAuth, TransactionController.split);
router.delete('/clear', requireAdmin, TransactionController.clearAll);
router.delete('/:id', requireAuth, TransactionController.delete);

export { router as transactionRoutes };
export default router;
