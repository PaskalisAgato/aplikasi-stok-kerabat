// backend/src/app.ts - v1.0.2 (final sync)
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/auth.js';

import session from 'express-session';

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

import { monitorMiddleware, errorHandler as enterpriseErrorHandler } from './middleware/monitor.js';
import { idempotencyMiddleware, cleanupIdempotencyKeys } from './middleware/idempotency.js';
import { UserService } from './services/user.service.js';

const UserController = (await import('./controllers/user.controller.js')).UserController;

// 1. Rate Limiting (Anti-Spam / Anti-Egress Abuse)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Terlalu banyak permintaan dari IP ini. Mohon tunggu sebentar.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const app = express();

// DEBUG LOGGING (WAJIB)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[REQUEST] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
});

// STRICT CORS
const ALLOWED_ORIGINS = [
    "https://aplikasi-stok-kerabat-pos.vercel.app",
    "https://paskalisagato.github.io",
    "http://localhost:5186",
    "http://localhost:5173"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Idempotency-Key'],
    exposedHeaders: ['Set-Cookie', 'X-System-Safe-Mode', 'X-Idempotency-Replay']
}));

// SESSION MANAGEMENT (WAJIB)
app.use(session({
    secret: process.env.SESSION_SECRET || 'kerabat-pos-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Render/Vercel are HTTPS
        sameSite: 'none', // Needed for cross-domain
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// 1. Enterprise Monitoring & Guardrails
app.use(limiter);
app.use(compression()); // Reduce payload egress by ~75% (Phase 2)

// 1.5 Response Size Guardrail (Phase 4: Prevent Egress Runaway)
app.use((req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function (body: any): Response {
        if (typeof body === 'string' && body.length > 4 * 1024 * 1024) {
             console.error(`[Guardrail] Blocked massive response (${(body.length / 1024 / 1024).toFixed(2)}MB) from ${req.method} ${req.originalUrl}`);
             return res.status(500).json({ 
                 success: false, 
                 message: `Response payload too large (${(body.length / 1024 / 1024).toFixed(2)}MB). Mohon gunakan fitur pencarian atau klik 'Muat Lebih Banyak'.` 
             });
        }
        return originalSend.call(this, body);
    };
    next();
});

app.use(monitorMiddleware);
app.use(idempotencyMiddleware); // Anti double-submit (Phase 3)

// 2. Background Tasks (Phase 3)
setInterval(cleanupIdempotencyKeys, 6 * 60 * 60 * 1000); // 6 hours

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// 2. Root Handler (Explicitly Block 60MB Ghost Leaks)
app.get('/', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Kerabat POS API Root. Use /api/* for endpoints.",
        version: "1.1.0-hardened"
    });
});


// 2. Health & Diag
app.get('/api/health', async (req: Request, res: Response) => {
    let dbStatus = 'waiting';
    try {
        await UserService.getAllUsers();
        dbStatus = 'connected';
    } catch (e: any) {
        dbStatus = `error: ${e.message}`;
    }
    res.status(200).json({ 
        success: true,
        data: {
            status: 'ok', 
            message: 'Kerabat Modular Backend v1.1.0 is running (Enterprise Hardened)',
            database: dbStatus,
            time: new Date().toISOString()
        }
    });
});

// 3. Custom Auth Endpoints (High Priority)
app.post('/api/auth/login-pin', UserController.loginByPin);

// Manual session endpoint for frontend
app.get('/api/auth/session', async (req: Request, res: Response) => {
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
            session = await UserService.getSessionById(bearerToken);
        }
        
        // 2. Try resolving via Cookie (Hashed Token) if Bearer fails or is absent
        if (!session && cookieToken) {
            session = await UserService.getSessionByHashedToken(cookieToken);
        }

        if (!session && (req.session as any)?.user) {
            session = {
                id: 'express-session',
                user: (req.session as any).user
            };
        }

        if (!session) {
            return res.status(200).json({ session: null });
        }

        res.json({ session });
    } catch (error: any) {
        console.error('Session check error:', error);
        res.status(500).json({ error: 'Session check failed' });
    }
});

// Manual logout endpoint - destroys session in DB and clears cookies
app.post('/api/auth/logout-manual', async (req: Request, res: Response) => {
    try {
        const cookieToken = req.cookies['better-auth.session_token'];
        const bearerToken = req.headers.authorization?.replace('Bearer ', '');
        
        // 1. Destroy express-session (Wajib)
        req.session.destroy((err) => {
            if (err) console.error("[LOGOUT_ERROR] Failed to destroy express-session:", err);
        });

        // 2. Clear Manual DB Sessions (Backward Compat)
        if (bearerToken) {
            await UserService.deleteSessionById(bearerToken);
        }
        
        if (cookieToken) {
            await UserService.deleteSessionByHashedToken(cookieToken);
            await UserService.deleteSessionByToken(cookieToken);
        }

        // 3. Clear cookies
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'none' as const,
            path: '/'
        };
        res.clearCookie('better-auth.session_token', cookieOptions);
        res.clearCookie('connect.sid', cookieOptions); // express-session default cookie
        
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        console.error('Logout error:', error);
        res.status(200).json({ success: true, message: 'Logged out (with server warning)' });
    }
});

// 4. API Routes (Products, Transactions, etc.)
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
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

// 5. Better Auth Managed Endpoints (Explicit Regex Match)
// Using a Regex to avoid Express 5 PathError with wildcards
app.all(/^\/api\/auth\/.*/, (req: Request, res: Response) => {
    return toNodeHandler(auth)(req, res);
});

// 5. Final Catch-all for API 404s (Only if no previous route matched)
app.use('/api', (req: Request, res: Response) => {
    console.warn(`[RouteNotFound] ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false,
        message: "Route Not Found",
        data: {
            path: req.originalUrl,
            method: req.method
        }
    });
});

// 5. Final Enterprise Error Handler
app.use(enterpriseErrorHandler);

export default app;
