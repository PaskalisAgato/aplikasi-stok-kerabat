import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, TransactionController.getAll);
router.get('/:id', requireAuth, TransactionController.getById);
router.post('/', requireAuth, TransactionController.checkout);
router.put('/:id', requireAdmin, TransactionController.update);
router.delete('/:id', requireAdmin, TransactionController.delete);

export { router as transactionRoutes };
export default router;
