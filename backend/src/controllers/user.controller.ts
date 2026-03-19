import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    static async getAll(req: Request, res: Response) {
        try {
            const users = await UserService.getAllUsers();
            res.json(users);
        } catch (error) {
            console.error('Error in UserController.getAll:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const currentUserId = (req as any).user?.id;
            if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

            const { name, email, role, pin } = req.body;
            if (!name || !email || !role || !pin) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const newUser = await UserService.createUser(req.body, currentUserId);
            res.status(201).json(newUser);
        } catch (error) {
            console.error('Error in UserController.create:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const currentUserId = (req as any).user?.id;
            if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

            const updatedUser = await UserService.updateUser(id, req.body, currentUserId);
            if (!updatedUser) return res.status(404).json({ error: 'User not found' });

            res.json(updatedUser);
        } catch (error) {
            console.error('Error in UserController.update:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const currentUserId = (req as any).user?.id;
            if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

            const deletedUser = await UserService.deleteUser(id, currentUserId);
            if (!deletedUser) return res.status(404).json({ error: 'User not found' });

            res.json({ message: 'User deleted successfully', user: deletedUser });
        } catch (error) {
            console.error('Error in UserController.delete:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }
}
