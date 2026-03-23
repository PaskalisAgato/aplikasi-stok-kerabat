import { Router } from 'express';
import { TodoController } from '../controllers/todo.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Everyone (Admin & Employee) can get active todos
router.get('/', requireAuth, TodoController.getTodos);

// Admin only: CRUD & History
router.post('/', requireAdmin, TodoController.createTodo);
router.put('/:id', requireAdmin, TodoController.updateTodo);
router.delete('/:id', requireAdmin, TodoController.deleteTodo);
router.get('/history', requireAdmin, TodoController.getHistory);
router.delete('/history/clear', requireAdmin, TodoController.clearHistory);

// Employee: Mark as completed
router.post('/:id/complete', requireAuth, TodoController.completeTodo);

export { router as todoRoutes };
