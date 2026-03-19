"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Use file logging since terminal output is unstable
const logPath = path_1.default.join(process.cwd(), 'boot.log');
const log = (msg) => {
    const timestamp = new Date().toISOString();
    try {
        fs_1.default.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    }
    catch (e) {
        // Fallback if file system is locked
    }
    console.log(msg);
};
// Global Error Catching
process.on('uncaughtException', (err) => {
    log(`FATAL: Uncaught Exception: ${err.message}\n${err.stack}`);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    log(`FATAL: Unhandled Rejection at: ${promise}, reason: ${reason}`);
});
log('--- STARTING BACKEND BOOTSTRAP ---');
log('--- Phase 1: Environment & Base Config ---');
require("dotenv/config");
log('Loaded dotenv');
log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
log(`PORT: ${process.env.PORT || '5000 (default)'}`);
log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'FOUND' : 'MISSING'}`);
log(`BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? 'FOUND' : 'MISSING'}`);
log(`BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || 'NOT SET (defaults to localhost:5000)'}`);
log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
if (!process.env.DATABASE_URL) {
    log('ERROR: DATABASE_URL is required but missing!');
}
log('--- Phase 2: Loading Auth Configuration ---');
const auth_1 = require("./config/auth");
const node_1 = require("better-auth/node");
const session_1 = require("./lib/session");
log('Loaded Auth & Sessions Modules');
log('--- Phase 3: Initializing Express ---');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
log('--- Phase 4: Setting up Middleware ---');
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        'http://localhost:5181',
        'http://localhost:5186',
        'https://paskalisagato.github.io'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
// Use RegExp to catch all routes safely in Express 5, circumventing path-to-regexp string limitations
app.options(/^.*$/, (0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
// Diagnostic: Log View Route (Remote Debugging)
app.get('/api/logs', (req, res) => {
    try {
        if (fs_1.default.existsSync(logPath)) {
            const logs = fs_1.default.readFileSync(logPath, 'utf8');
            res.header('Content-Type', 'text/plain').send(logs);
        }
        else {
            res.status(404).send('Log file not found');
        }
    }
    catch (e) {
        res.status(500).send('Error reading logs');
    }
});
// Request Logger
app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
});
const db_1 = require("./db");
const schema_1 = require("./db/schema");
const drizzle_orm_1 = require("drizzle-orm");
log('Loaded DB & Middleware');
app.post('/api/auth/login-pin', async (req, res) => {
    const { role, pin } = req.body;
    log(`Login attempt: role=${role}, pin=${pin?.replace(/./g, '*')}`);
    if (!role || !pin)
        return res.status(400).json({ error: "Role and PIN are required" });
    try {
        // If they select 'Karyawan', we also allow other staff roles like 'Barista'
        let userQuery;
        if (role === 'Karyawan') {
            userQuery = await db_1.db.query.users.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.role, 'Karyawan'), (0, drizzle_orm_1.eq)(schema_1.users.role, 'Barista')), (0, drizzle_orm_1.eq)(schema_1.users.pin, pin))
            });
        }
        else {
            userQuery = await db_1.db.query.users.findFirst({
                where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.role, role), (0, drizzle_orm_1.eq)(schema_1.users.pin, pin))
            });
        }
        const foundUser = userQuery;
        if (!foundUser) {
            log(`Login failed: role=${role}, pin incorrect or user not found`);
            return res.status(401).json({ error: "PIN atau Peran salah" });
        }
        const sessionId = crypto_1.default.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const hashedToken = crypto_1.default.createHash('sha256').update(sessionId).digest('hex');
        await db_1.db.insert(schema_1.sessions).values({
            id: sessionId,
            token: hashedToken,
            userId: foundUser.id,
            expiresAt: expiresAt,
            createdAt: now,
            updatedAt: now,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });
        res.cookie('better-auth.session_token', sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            expires: expiresAt,
            path: '/'
        });
        log(`Session created for user ${foundUser.id}`);
        res.json({ user: foundUser, session: { id: sessionId, expiresAt } });
    }
    catch (err) {
        log(`PIN Auth Error: ${err.message}`);
        res.status(500).json({ error: "Gagal memproses login" });
    }
});
app.get('/api/auth/get-session', async (req, res) => {
    const session = await (0, session_1.getSessionManually)(req);
    return res.json(session);
});
app.post('/api/auth/logout-manual', (req, res) => {
    res.clearCookie('better-auth.session_token', { path: '/' });
    res.json({ success: true });
});
app.get('/api/auth', (req, res) => res.send("Auth API is active."));
app.use("/api/auth", (0, node_1.toNodeHandler)(auth_1.auth));
const inventory_1 = require("./routes/inventory");
const recipes_1 = require("./routes/recipes");
const sales_1 = require("./routes/sales");
const finance_1 = require("./routes/finance");
const users_1 = require("./routes/users");
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Kerabat Backend API v1.0.1 is running' });
});
app.get('/api/diag', (req, res) => {
    res.json({
        status: 'ok',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
            FRONTEND_URL: process.env.FRONTEND_URL,
        },
        corsOrigins: [
            'https://paskalisagato.github.io'
        ],
        time: new Date().toISOString()
    });
});
app.get('/api/test-cors', (req, res) => {
    res.json({ message: "CORS is working if you can see this", origin: req.headers.origin });
});
app.use('/api/inventory', inventory_1.inventoryRouter);
app.use('/api/recipes', recipes_1.recipesRouter);
app.use('/api/sales', sales_1.salesRouter);
app.use('/api/finance', finance_1.financeRouter);
app.use('/api/users', users_1.usersRouter);
// Global Error Handler for Express
app.use((err, req, res, next) => {
    log(`EXPRESS ERROR: ${err.message}\n${err.stack}`);
    // Explicitly set CORS headers for error responses
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
});
app.listen(PORT, () => {
    log(`🚀 Kerabat Backend is running on port ${PORT}`);
    log(`Environment: ${process.env.NODE_ENV}`);
});
