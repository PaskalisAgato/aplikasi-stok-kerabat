import { Request, Response } from 'express';
import { UserService } from '../services/user.service.js';
import { auth } from '../config/auth.js';

export class UserController {
    static async loginByPin(req: Request, res: Response) {
        try {
            const { role, pin } = req.body;
            console.log(`[LoginRequest] Role: ${role}, PIN: ${pin ? '****' : 'EMPTY'}`);
            
            if (!role || !pin) {
                return res.status(400).json({ error: 'Role and PIN are required' });
            }

            const user = await UserService.loginByPin(role, pin);
            if (!user) {
                console.warn(`[LoginFailed] No user found for Role: ${role} and PIN: ${pin}`);
                return res.status(401).json({ error: 'PIN atau Role salah' });
            }

            // Create session manually using Drizzle fallback
            const session = await UserService.createSessionManual(user.id);
            console.log(`[SessionCreatedManual] Session ID: ${session.id}, Token: ${session.token.substring(0, 5)}...`);

            // Set Better Auth compatible cookie
            res.cookie('better-auth.session_token', session.token, {
                httpOnly: true,
                secure: true, // Render is always HTTPS
                expires: session.expiresAt,
                sameSite: 'none', // Needed for cross-domain Vercel -> Render
                path: '/'
            });

            // Audit log for login
            try {
                await UserService.logAction(user.id, `LOGIN_PIN: ${user.name} (${user.role})`, 'user');
            } catch (auditError) {
                console.error('[AuditError] Failed to log login action:', auditError);
                // Don't fail the whole login if audit log fails
            }

            res.json({ session });
        } catch (error: any) {
            console.error('Error in UserController.loginByPin:', error);
            res.status(500).json({ 
                error: 'Gagal melakukan login', 
                details: process.env.NODE_ENV === 'development' ? error.message : undefined 
            });
        }
    }

    static async getAll(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const users = user.role === 'Admin' 
                ? await UserService.getAllUsers() 
                : await UserService.getAllUsersPublic();
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
