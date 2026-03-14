import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '../index';

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
        
        if (!name || !email || !role || !pin) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [newUser] = await db.insert(users).values({
            id: Math.random().toString(36).substring(7),
            name,
            email,
            emailVerified: true,
            role,
            pin,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Failed to create user account' });
    }
});
