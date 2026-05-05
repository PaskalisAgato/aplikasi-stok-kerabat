import { getSessionManually } from '../lib/session.js';
// Custom Auth Middleware that can be attached to protected Routes
export const requireAuth = async (req, res, next) => {
    try {
        // 1. Check PERMANENT SESSION (Wajib)
        const sessionUser = req.session?.user;
        if (sessionUser) {
            req.user = sessionUser;
            return next();
        }
        // 2. Fallback to Manual DB Session (Backward Compatibility)
        const session = await getSessionManually(req);
        if (!session) {
            console.warn(`[AUTH_FAILED] ${req.method} ${req.url} - Unauthorized`);
            return res.status(401).json({ error: "Unauthorized / Session Expired" });
        }
        // Attach user info to request context
        req.user = session.user;
        next();
    }
    catch (err) {
        console.error("Manual Auth Error:", err);
        res.status(500).json({ error: "Auth Validation Error" });
    }
};
// --- Admin-Only Middleware ---
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
