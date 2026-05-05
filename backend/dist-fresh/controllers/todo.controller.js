import { TodoService } from '../services/todo.service.js';
export class TodoController {
    static async getTodos(req, res) {
        try {
            const user = req.user;
            const todos = await TodoService.getAllTodos(user?.role, user?.id);
            res.json({
                success: true,
                data: todos,
                meta: { total: todos.length, limit: 100, page: 1 }
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
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
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async createTodo(req, res) {
        try {
            const user = req.user;
            if (user?.role !== 'Admin') {
                return res.status(403).json({ error: 'Hanya Admin yang dapat membuat tugas.' });
            }
            const todo = await TodoService.createTodo({
                ...req.body,
                createdBy: user.id
            });
            res.status(201).json(todo);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async updateTodo(req, res) {
        try {
            const id = parseInt(req.params.id);
            const todo = await TodoService.updateTodo(id, req.body);
            res.json(todo);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async completeTodo(req, res) {
        try {
            const id = parseInt(req.params.id);
            const userId = req.user?.id;
            const { photoProof } = req.body;
            if (!photoProof) {
                return res.status(400).json({ error: 'Bukti foto wajib diunggah.' });
            }
            const todo = await TodoService.completeTodo(id, userId, photoProof);
            res.json(todo);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async deleteTodo(req, res) {
        try {
            const id = parseInt(req.params.id);
            await TodoService.deleteTodo(id);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async clearHistory(req, res) {
        try {
            await TodoService.clearHistory();
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getPhoto(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { type } = req.query; // 'todo' or 'completion'
            let photo;
            if (type === 'completion') {
                photo = await TodoService.getCompletionPhoto(id);
            }
            else {
                photo = await TodoService.getTodoPhoto(id);
            }
            if (!photo) {
                return res.status(404).json({ error: 'Foto tidak ditemukan.' });
            }
            let parsedPhoto = photo;
            try {
                if (photo.startsWith('[')) {
                    parsedPhoto = JSON.parse(photo);
                }
            }
            catch (e) {
                // If parse fails, assume it's just a single string URL
            }
            res.json({
                success: true,
                data: parsedPhoto
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getSettings(req, res) {
        try {
            const settings = await TodoService.getSettings();
            res.json({
                success: true,
                data: settings
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async updateSetting(req, res) {
        try {
            const { key, value } = req.body;
            if (!key || !value) {
                return res.status(400).json({ error: 'Key dan value wajib ada.' });
            }
            const setting = await TodoService.updateSetting(key, value);
            res.json({
                success: true,
                data: setting
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
