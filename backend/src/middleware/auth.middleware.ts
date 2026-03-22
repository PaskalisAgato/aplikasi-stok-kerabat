import { Request, Response, NextFunction } from 'express';
import { getSessionManually } from '../lib/session.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await getSessionManually(req);
        if (!session) {
            return res.status(401).json({ error: "Unauthorized / Session Expired" });
        }
        (req as any).user = session.user;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(500).json({ error: "Auth Validation Error" });
    }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    await requireAuth(req, res, () => {
        const user = (req as any).user;
        if (user && user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ error: "Akses ditolak. Fitur ini hanya untuk Admin." });
        }
    });
};
