import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, TransactionController.checkout);

export { router as transactionRoutes };
export default router;
