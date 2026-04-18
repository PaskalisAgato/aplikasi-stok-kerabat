// backend/src/app.ts - v1.1.7 (Performance & Stability Refactor)
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';

// @ts-ignore - TS NodeNext resolution workaround
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/auth.js';

// Route Imports
import { productRoutes } from './routes/product.routes.js';
import { transactionRoutes } from './routes/transaction.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { inventoryRouter } from './routes/inventory.js';
import { financeRouter } from './routes/finance.js';
import { auditRouter } from './routes/audit.js';
import { shiftRoutes } from './routes/shift.routes.js';
import { attendanceRoutes } from './routes/attendance.routes.js';
import { todoRoutes } from './routes/todo.routes.js';
import { adminRouter } from './routes/admin.js';
import { migrationRouter } from './routes/migration.routes.js';
import { containersRouter } from './routes/containers.js';
import { cashierShiftRoutes } from './routes/cashierShift.routes.js';
import { analyticsRouter } from './routes/analytics.js';
import { printRoutes } from './routes/print.routes.js';
import { memberRoutes } from './routes/member.routes.js';
import { discountRoutes } from './routes/discount.routes.js';

// Controller Imports (Static instead of Dynamic Await)
import { UserController } from './controllers/user.controller.js';
import { TransactionController } from './controllers/transaction.controller.js';

import { monitorMiddleware, errorHandler as enterpriseErrorHandler } from './middleware/monitor.js';
import { idempotencyMiddleware, cleanupIdempotencyKeys } from './middleware/idempotency.js';
import { requireAuth } from './middleware/auth.js';
import { UserService } from './services/user.service.js';

const app = express();

// 1. STRICT CORS (MUST BE AT THE VERY TOP)
const ALLOWED_ORIGINS = [
    "https://aplikasi-stok-kerabat-pos.vercel.app",
    "https://paskalisagato.github.io",
    "http://localhost:5186",
    "http://localhost:5173",
    "http://localhost:5193" // Members sub-app local
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || origin.includes('localhost')) {
            callback(null, true);
        } else {
            console.warn(`[CORS_REJECTED] Origin: ${origin}`);
            callback(null, true); // Temporarily relaxed to "true" to debug Render issues
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Idempotency-Key'],
    exposedHeaders: ['Set-Cookie', 'X-System-Safe-Mode', 'X-Idempotency-Replay'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// 2. Explicit OPTIONS handler for Express 5 compatibility
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.includes('localhost'))) {
            res.header("Access-Control-Allow-Origin", origin);
        } else {
             // Fallback to allow debugging
             res.header("Access-Control-Allow-Origin", origin || "*");
        }
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Idempotency-Key");
        res.header("Access-Control-Allow-Credentials", "true");
        return res.sendStatus(204);
    }
    next();
});

// 3. Rate Limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 200, // Slightly increased for stability
    message: { status: 429, success: false, message: 'Terlalu banyak permintaan.' }
});

// 4. Core Middlewares
app.use(limiter);
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'kerabat-pos-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, 
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
    }
}));

// DEBUG LOGGING
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[REQUEST] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
});

app.use(monitorMiddleware);
app.use(idempotencyMiddleware);

// Root & Health
app.get('/', (req: Request, res: Response) => {
    res.json({ success: true, message: "Kerabat POS API v1.1.7-stable", status: "ok" });
});

app.get('/api/health', async (req: Request, res: Response) => {
    try {
        await UserService.getAllUsersPublic();
        res.json({ success: true, database: 'connected', time: new Date().toISOString() });
    } catch (e: any) {
        res.status(500).json({ success: false, database: 'error', message: e.message });
    }
});

// Auth Routes
app.post('/api/auth/login-pin', UserController.loginByPin);
app.get('/api/auth/session', async (req: Request, res: Response) => {
    try {
        const bearerToken = req.headers.authorization?.replace('Bearer ', '');
        const cookieToken = req.cookies['better-auth.session_token'];
        let session = null;
        if (bearerToken) session = await UserService.getSessionById(bearerToken);
        if (!session && cookieToken) session = await UserService.getSessionByHashedToken(cookieToken);
        res.json({ session: session || null });
    } catch (error) {
        res.status(500).json({ error: 'Session check failed' });
    }
});

// Protected Transaction Routes
app.post('/api/transactions/checkout', requireAuth, TransactionController.checkout);
app.post('/api/checkout', requireAuth, TransactionController.checkout);

// API Resource Routes
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/inventory', inventoryRouter);
app.use('/api/finance', financeRouter);
app.use('/api/audit', auditRouter);
app.use('/api/shifts', shiftRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/todo', todoRoutes);
app.use('/api/system', adminRouter);
app.use('/api/admin', migrationRouter);
app.use('/api/cashier-shifts', cashierShiftRoutes);
app.use('/api/analytics', analyticsRouter);
app.use('/api/containers', containersRouter);
app.use('/api/print', printRoutes);
app.use('/uploads', express.static('uploads'));

// Better Auth Managed Endpoints (Regex)
app.all(/^\/api\/auth\/.*/, (req: Request, res: Response) => {
    return toNodeHandler(auth)(req, res);
});

// Final Catch-all
app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: "Route Not Found", path: req.originalUrl });
});

app.use(enterpriseErrorHandler);

// Periodic cleanup
setInterval(cleanupIdempotencyKeys, 6 * 60 * 60 * 1000);

export default app;
