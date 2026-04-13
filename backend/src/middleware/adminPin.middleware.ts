import { Request, Response, NextFunction } from 'express';
import { getSessionManually } from '../lib/session.js';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const requireAdminPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { adminPin } = req.body;
        
        const sessionData = await getSessionManually(req);
        if (!sessionData?.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (!adminPin) {
            return res.status(400).json({ success: false, error: 'PIN Admin dibutuhkan untuk tindakan ini.' });
        }

        // Find an admin with this PIN
        const admins = await db.select().from(schema.users)
            .where(eq(schema.users.pin, adminPin))
            .limit(1);

        const admin = admins[0];

        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ success: false, error: 'PIN Admin tidak valid. Coba lagi.' });
        }

        // Attach authorizing admin to req
        (req as any).adminApprover = admin;
        next();
    } catch (err: any) {
        return res.status(500).json({ success: false, error: 'PIN Verification Error: ' + err.message });
    }
};
