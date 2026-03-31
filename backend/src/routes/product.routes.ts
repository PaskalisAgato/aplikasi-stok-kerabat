import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { validateBase64Image } from '../middleware/validateImage.js';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/:id/photo', ProductController.getPhoto);
router.post('/', validateBase64Image('imageUrl'), ProductController.create);
router.put('/:id', validateBase64Image('imageUrl'), ProductController.update);
router.delete('/:id', ProductController.delete);

export { router as productRoutes };
export default router;
