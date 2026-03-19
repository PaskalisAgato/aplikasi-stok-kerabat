"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const auth_1 = require("./config/auth");
const node_1 = require("better-auth/node");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// 1. Core Middlewares
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL || '*', 'https://paskalisagato.github.io'],
    credentials: true,
}));
app.use(express_1.default.json()); // Parse JSON payloads
// 2. Authentication Middleware Integration (Better Auth)
// Mount Better Auth endpoints at /api/auth
app.use("/api/auth", (0, node_1.toNodeHandler)(auth_1.auth));
// Custom Auth Middleware that can be attached to protected Routes
const requireAuth = async (req, res, next) => {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: new Headers(req.headers)
        });
        if (!session) {
            return res.status(401).json({ error: "Unauthorized / Session Expired" });
        }
        // Attach user info to request context
        req.user = session.user;
        next();
    }
    catch (err) {
        res.status(500).json({ error: "Auth Validation Error" });
    }
};
exports.requireAuth = requireAuth;
const inventory_1 = require("./routes/inventory");
const recipes_1 = require("./routes/recipes");
const sales_1 = require("./routes/sales");
const finance_1 = require("./routes/finance");
// 3. Application Routes (Placeholders)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Kerabat Backend API is running' });
});
// Mount Routes
app.use('/api/inventory', inventory_1.inventoryRouter);
app.use('/api/recipes', recipes_1.recipesRouter);
app.use('/api/sales', sales_1.salesRouter);
app.use('/api/finance', finance_1.financeRouter);
// 4. Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Server Error]: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
});
// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Kerabat Backend is running on http://localhost:${PORT}`);
    console.log(`Auth endpoints ready at http://localhost:${PORT}/api/auth`);
});
