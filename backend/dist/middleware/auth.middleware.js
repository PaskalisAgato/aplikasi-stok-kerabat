import { getSessionManually } from '../lib/session.js';
export const requireAuth = async (req, res, next) => {
    try {
        const session = await getSessionManually(req);
        if (!session) {
            return res.status(401).json({ error: "Unauthorized / Session Expired" });
        }
        req.user = session.user;
        next();
    }
    catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(500).json({ error: "Auth Validation Error" });
    }
};
export const requireAdmin = async (req, res, next) => {
    await requireAuth(req, res, () => {
        const user = req.user;
        if (user && user.role === 'Admin') {
            next();
        }
        else {
            res.status(403).json({ error: "Akses ditolak. Fitur ini hanya untuk Admin." });
        }
    });
};
