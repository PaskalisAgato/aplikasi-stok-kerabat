import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { desc } from 'drizzle-orm';

const router = Router();

// GET /api/loyalty/settings
router.get('/settings', async (req: Request, res: Response) => {
    try {
        const [settings] = await db.select().from(schema.loyaltySettings).orderBy(desc(schema.loyaltySettings.updatedAt)).limit(1);
        if (!settings) {
            // Return defaults if not found
            return res.json({
                pointRatio: '10000.00',
                pointValue: '100.00'
            });
        }
        res.json(settings);
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT /api/loyalty/settings (Admin only)
router.put('/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { pointRatio, pointValue } = req.body;
        
        // Ensure values are numbers
        const r = parseFloat(pointRatio);
        const v = parseFloat(pointValue);
        
        if (isNaN(r) || isNaN(v)) {
            return res.status(400).json({ success: false, message: 'Rasio dan nilai poin harus berupa angka' });
        }

        const [updated] = await db.insert(schema.loyaltySettings).values({
            pointRatio: r.toString(),
            pointValue: v.toString(),
        }).returning();

        res.json({ success: true, data: updated });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export { router as loyaltyRoutes };
export default router;
