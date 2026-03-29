import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { auth } from '../config/auth.js';

export class UserController {
    static async loginByPin(req: Request, res: Response) {
        try {
            const { role, pin } = req.body;
            
            // 1. INPUT VALIDATION (WAJIB)
            if (!role || !pin) {
                console.warn("[LOGIN_PIN_WARNING] Missing role or pin in request body");
                return res.status(400).json({ error: 'Role and PIN are required' });
            }

            console.log(`[LOGIN_PIN_DEBUG] Attempting login for Role: ${role}`);

            // 2. QUERY USER (WAJIB)
            let user;
            try {
                user = await UserService.loginByPin(role, pin);
            } catch (dbError: any) {
                console.error("LOGIN_PIN_DB_ERROR:", dbError);
                return res.status(500).json({ 
                    message: "Internal Server Error (Database Connection)", 
                    error: dbError.message 
                });
            }

            if (!user) {
                console.warn(`[LOGIN_PIN_FAILED] Invalid credentials for Role: ${role}`);
                return res.status(401).json({ message: "Invalid PIN or Role" });
            }

            console.log(`[LOGIN_PIN_SUCCESS] User found: ${user.name} (${user.id})`);

            // 3. SET SESSION (WAJIB)
            (req.session as any).user = {
                id: user.id,
                name: user.name,
                role: user.role,
                email: user.email
            };

            // Also keep backward compatible manual session if possible
            const manualSession = await UserService.createSessionManual(user.id);
            console.log(`[SESSION_DEBUG] req.session.user set and Manual Session created: ${manualSession.id}`);

            // Audit log
            try {
                await UserService.logAction(user.id, `LOGIN_PIN: ${user.name}`, 'user');
            } catch (e) {}

            return res.status(200).json({ 
                success: true, 
                user: (req.session as any).user,
                sessionId: manualSession.id // Fallback for UUID based auth
            });

        } catch (err: any) {
            console.error("LOGIN_PIN_ERROR:", err);
            return res.status(500).json({ 
                message: "Internal Server Error", 
                error: err.message 
            });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const users = user.role === 'Admin' 
                ? await UserService.getAllUsers() 
                : await UserService.getAllUsersPublic();
            res.json({ success: true, data: users, meta: { total: users.length, limit: users.length, page: 1 } });
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
