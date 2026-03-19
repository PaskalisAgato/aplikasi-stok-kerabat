import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAdmin, UserController.getAll);
router.post('/', requireAdmin, UserController.create);
router.put('/:id', requireAdmin, UserController.update);
router.delete('/:id', requireAdmin, UserController.delete);

export { router as userRoutes };
export default router;
