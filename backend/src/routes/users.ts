import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { users } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth';

export const usersRouter = Router();

// GET all users (Admin only)
usersRouter.get('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const _users = await db.select().from(users).orderBy(desc(users.createdAt));
        res.json(_users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST new user (Admin only)
usersRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { name, email, role, pin } = req.body;
        const currentUser = (req as any).user;
        
        if (!name || !email || !role || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [newUser] = await db.insert(users).values({
            id: crypto.randomUUID(),
            name,
            email,
            emailVerified: true,
            role,
            pin,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        // Log to Audit
        await db.insert(schema.auditLogs).values({
            userId: currentUser.id,
            action: `CREATE_USER: ${newUser.name} (${newUser.role})`,
            tableName: 'user',
            newData: JSON.stringify(newUser),
            createdAt: new Date()
        });

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Failed to create user account' });
    }
});

// PUT update user (Admin only)
usersRouter.put('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role, pin } = req.body;
        const currentUser = (req as any).user;

        const oldUser = await db.select().from(users).where(eq(users.id, id as string)).limit(1);

        const [updatedUser] = await db.update(users)
            .set({ 
                name, 
                email, 
                role, 
                pin,
                updatedAt: new Date()
            })
            .where(eq(users.id, id as string))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log to Audit
        await db.insert(schema.auditLogs).values({
            userId: currentUser.id,
            action: `UPDATE_USER: ${updatedUser.name}`,
            tableName: 'user',
            oldData: JSON.stringify(oldUser[0]),
            newData: JSON.stringify(updatedUser),
            createdAt: new Date()
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user account' });
    }
});

// DELETE user (Admin only)
usersRouter.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = (req as any).user;
        
        const [deletedUser] = await db.delete(users)
            .where(eq(users.id, id as string))
            .returning();

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log to Audit
        await db.insert(schema.auditLogs).values({
            userId: currentUser.id,
            action: `DELETE_USER: ${deletedUser.name}`,
            tableName: 'user',
            oldData: JSON.stringify(deletedUser),
            createdAt: new Date()
        });

        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user account' });
    }
});
