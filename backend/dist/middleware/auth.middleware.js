"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const session_1 = require("../lib/session");
const requireAuth = async (req, res, next) => {
    try {
        const session = await (0, session_1.getSessionManually)(req);
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
exports.requireAuth = requireAuth;
const requireAdmin = async (req, res, next) => {
    await (0, exports.requireAuth)(req, res, () => {
        const user = req.user;
        if (user && user.role === 'Admin') {
            next();
        }
        else {
            res.status(403).json({ error: "Akses ditolak. Fitur ini hanya untuk Admin." });
        }
    });
};
exports.requireAdmin = requireAdmin;
