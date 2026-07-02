import { Router } from 'express';
import { TableController } from '../controllers/table.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', TableController.getAll);
router.post('/bulk', TableController.updateBulk);
router.post('/', TableController.create);
router.put('/:id', TableController.update);
router.delete('/:id', TableController.delete);

export { router as tableRoutes };
export default router;
