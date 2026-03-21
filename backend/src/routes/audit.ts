import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import * as schema from '../db/schema.js';
import { desc, eq, sql } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';

export const auditRouter = Router();

// GET all audit logs (Admin only)
auditRouter.get('/', requireAdmin, async (req: Request, res: Response) => {
    try {
        const logs = await db.select({
            id: schema.auditLogs.id,
            userId: schema.auditLogs.userId,
            userName: schema.users.name,
            action: schema.auditLogs.action,
            tableName: schema.auditLogs.tableName,
            oldData: schema.auditLogs.oldData,
            newData: schema.auditLogs.newData,
            createdAt: schema.auditLogs.createdAt,
            role: schema.users.role,
        })
        .from(schema.auditLogs)
        .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(100);

        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity history' });
    }
});
