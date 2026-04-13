import { Router } from 'express';
import { PrintController } from '../controllers/print.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Frontend Call: Enqueue a job
router.post('/enqueue', requireAuth, PrintController.enqueue);

// Local Agent Call: Poll & Ack (Poll requires auth, could be a specific agent user)
router.get('/poll', requireAuth, PrintController.poll);
router.post('/acknowledge', requireAuth, PrintController.acknowledge);

export { router as printRoutes };
export default router;
