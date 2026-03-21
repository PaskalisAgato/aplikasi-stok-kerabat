"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const node_1 = require("better-auth/node");
const auth_1 = require("./config/auth");
// Route Imports
const product_routes_1 = require("./routes/product.routes");
const transaction_routes_1 = require("./routes/transaction.routes");
const user_routes_1 = require("./routes/user.routes");
const inventory_1 = require("./routes/inventory");
const finance_1 = require("./routes/finance");
const audit_1 = require("./routes/audit");
// Middleware Imports
const error_middleware_1 = require("./middleware/error.middleware");
const user_service_1 = require("./services/user.service");
const user_controller_1 = require("./controllers/user.controller");
const app = (0, express_1.default)();
// Global Logger (Temporary for Debugging)
app.use((req, res, next) => {
    console.log(`[IncomingRequest] ${req.method} ${req.originalUrl} - Path: ${req.path}`);
    next();
});
// 1. Global Middlewares
app.use((0, cors_1.default)({
    origin: true, // Allow all origins during debugging to rule out CORS as the cause of "Koneksi Terhambat"
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// 2. Health & Diag
app.get('/api/health', async (req, res) => {
    let dbStatus = 'waiting';
    try {
        await user_service_1.UserService.getAllUsers();
        dbStatus = 'connected';
    }
    catch (e) {
        dbStatus = `error: ${e.message}`;
    }
    res.status(200).json({
        status: 'ok',
        message: 'Kerabat Modular Backend v1.0.0 is running',
        database: dbStatus,
        time: new Date().toISOString()
    });
});
// 3. Custom Auth Endpoints (High Priority)
app.post('/api/auth/login-pin', user_controller_1.UserController.loginByPin);
// Manual session endpoint for frontend
app.get('/api/auth/session', async (req, res) => {
    try {
        const cookieToken = req.cookies['better-auth.session_token'];
        const bearerToken = req.headers.authorization?.replace('Bearer ', '');
        if (!cookieToken && !bearerToken) {
            // Return 200 with null to avoid triggering frontend error loops for guests
            return res.status(200).json({ session: null });
        }
        let session = null;
        // 1. Try resolving via Bearer UUID first (most reliable for cross-domain since it is strictly from localStorage)
        if (bearerToken) {
            session = await user_service_1.UserService.getSessionById(bearerToken);
        }
        // 2. Try resolving via Cookie (Hashed Token) if Bearer fails or is absent
        if (!session && cookieToken) {
            session = await user_service_1.UserService.getSessionByHashedToken(cookieToken);
        }
        if (!session) {
            return res.status(200).json({ session: null });
        }
        res.json({ session });
    }
    catch (error) {
        console.error('Session check error:', error);
        res.status(500).json({ error: 'Session check failed' });
    }
});
// Manual logout endpoint - destroys session in DB and clears cookies
app.post('/api/auth/logout-manual', async (req, res) => {
    try {
        const cookieToken = req.cookies['better-auth.session_token'];
        const bearerToken = req.headers.authorization?.replace('Bearer ', '');
        // Bearer token from localStorage = session UUID (primary key)
        if (bearerToken) {
            await user_service_1.UserService.deleteSessionById(bearerToken);
        }
        // Cookie token = hashed token stored in 'token' column
        if (cookieToken) {
            await user_service_1.UserService.deleteSessionByHashedToken(cookieToken);
            // Also try as plaintext in case cookie format changed
            await user_service_1.UserService.deleteSessionByToken(cookieToken);
        }
        // Clear cookies with EXACT same options as they were set during login
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        };
        res.clearCookie('better-auth.session_token', cookieOptions);
        res.clearCookie('better-auth.session_token.sig', cookieOptions);
        res.clearCookie('__Secure-better-auth.session_token', cookieOptions);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(200).json({ success: true, message: 'Logged out (with server warning)' });
    }
});
// 4. API Routes (Products, Transactions, etc.)
app.use('/api/products', product_routes_1.productRoutes);
app.use('/api/transactions', transaction_routes_1.transactionRoutes);
app.use('/api/users', user_routes_1.userRoutes);
app.use('/api/inventory', inventory_1.inventoryRouter);
app.use('/api/finance', finance_1.financeRouter);
app.use('/api/audit', audit_1.auditRouter);
// 5. Better Auth Managed Endpoints (Explicit Regex Match)
// Using a Regex to avoid Express 5 PathError with wildcards
app.all(/^\/api\/auth\/.*/, (req, res) => {
    return (0, node_1.toNodeHandler)(auth_1.auth)(req, res);
});
// 5. Final Catch-all for API 404s (Only if no previous route matched)
app.use('/api', (req, res) => {
    console.warn(`[RouteNotFound] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: "Route Not Found",
        path: req.originalUrl,
        method: req.method
    });
});
// 5. Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
