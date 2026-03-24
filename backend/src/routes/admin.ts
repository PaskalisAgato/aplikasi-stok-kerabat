import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, gte, sql, desc, count } from 'drizzle-orm';
import { requireAdmin } from '../middleware/auth.js';
import { performBackup } from '../scripts/backup-db.js';

export const adminRouter = Router();

// Enterprise System Health Stats
adminRouter.get('/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 1. Avg Response Time & Total Requests (24h)
        const stats = await db.select({
            avgResponse: sql<number>`AVG(${schema.systemLogs.responseTime})`,
            totalRequests: sql<number>`COUNT(*)`,
            totalPayload: sql<number>`SUM(${schema.systemLogs.payloadSize})`
        })
        .from(schema.systemLogs)
        .where(gte(schema.systemLogs.createdAt, twentyFourHoursAgo));

        // 2. Error Count (24h)
        const errors = await db.select({
            count: sql<number>`COUNT(*)`
        })
        .from(schema.systemLogs)
        .where(
            and(
                gte(schema.systemLogs.createdAt, twentyFourHoursAgo),
                gte(schema.systemLogs.statusCode, 400)
            )
        );

        // 3. Status Level Calculation
        const errorRate = stats[0].totalRequests ? (errors[0].count / stats[0].totalRequests) : 0;
        let status = 'NORMAL';
        let message = 'Sistem berjalan dengan baik';

        if (errorRate > 0.1 || stats[0].avgResponse > 2000) {
            status = 'CRITICAL';
            message = 'Tingkat error tinggi atau respon sangat lambat';
        } else if (errorRate > 0.05 || stats[0].avgResponse > 1000) {
            status = 'WARNING';
            message = 'Sistem melambat atau ada beberapa error terdeteksi';
        }

        res.json({
            status,
            message,
            metrics: {
                avgResponseTime: Math.round(stats[0].avgResponse || 0),
                totalRequestsValue: stats[0].totalRequests || 0,
                errorCount: errors[0].count || 0,
                estimatedEgressMB: Math.round((stats[0].totalPayload || 0) / (1024 * 1024) * 100) / 100
            }
        });
    } catch (error) {
        console.error('Failed to fetch health stats:', error);
        res.status(500).json({ error: 'Failed to fetch health stats' });
    }
});

// Backup History
adminRouter.get('/backups', requireAdmin, async (req: Request, res: Response) => {
    try {
        const history = await db.select().from(schema.backups).orderBy(desc(schema.backups.createdAt)).limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch backup history' });
    }
});

// Trigger Manual Backup
adminRouter.post('/backups/trigger', requireAdmin, async (req: Request, res: Response) => {
    try {
        const result = await performBackup();
        if (result.success) {
            res.json({ success: true, message: `Backup berhasil: ${result.filename}` });
        } else {
            res.status(500).json({ success: false, message: 'Backup gagal', error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger backup' });
    }
});

import { and } from 'drizzle-orm';
