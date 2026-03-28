import { Request, Response } from 'express';
import { TodoService } from '../services/todo.service.js';

export class TodoController {
    static async getTodos(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const todos = await TodoService.getAllTodos(user?.role, user?.id);
            res.json({
                success: true,
                data: todos,
                meta: { total: todos.length, limit: 100, page: 1 }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getHistory(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const { items, total } = await TodoService.getHistory(limit, offset);
            res.json({
                success: true,
                data: items,
                meta: {
                    total,
                    limit,
                    page
                }
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createTodo(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            if (user?.role !== 'Admin') {
                return res.status(403).json({ error: 'Hanya Admin yang dapat membuat tugas.' });
            }
            const todo = await TodoService.createTodo({
                ...req.body,
                createdBy: user.id
            });
            res.status(201).json(todo);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async updateTodo(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as any);
            const todo = await TodoService.updateTodo(id, req.body);
            res.json(todo);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async completeTodo(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as any);
            const userId = (req as any).user?.id;
            const { photoProof } = req.body;
            
            if (!photoProof) {
                return res.status(400).json({ error: 'Bukti foto wajib diunggah.' });
            }

            const todo = await TodoService.completeTodo(id, userId, photoProof);
            res.json(todo);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteTodo(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as any);
            await TodoService.deleteTodo(id);
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async clearHistory(req: Request, res: Response) {
        try {
            await TodoService.clearHistory();
            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
