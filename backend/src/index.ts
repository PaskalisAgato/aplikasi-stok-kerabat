import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Use file logging since terminal output is unstable
const logPath = path.join(process.cwd(), 'boot.log');
const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    } catch (e) {
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
import 'dotenv/config';
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
import { auth } from './config/auth';
import { toNodeHandler } from "better-auth/node";
import { getSessionManually } from './lib/session';
log('Loaded Auth & Sessions Modules');

log('--- Phase 3: Initializing Express ---');
const app = express();
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

app.use(cors(corsOptions));
// Use RegExp to catch all routes safely in Express 5, circumventing path-to-regexp string limitations
app.options(/^.*$/, cors(corsOptions));

app.use(express.json({ limit: '10mb' }));

// Diagnostic: Log View Route (Remote Debugging)
app.get('/api/logs', (req, res) => {
    try {
        if (fs.existsSync(logPath)) {
            const logs = fs.readFileSync(logPath, 'utf8');
            res.header('Content-Type', 'text/plain').send(logs);
        } else {
            res.status(404).send('Log file not found');
        }
    } catch (e) {
        res.status(500).send('Error reading logs');
    }
});

// Request Logger
app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    next();
});

import { requireAuth, requireAdmin } from './middleware/auth';
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq, and, or } from 'drizzle-orm';
log('Loaded DB & Middleware');

app.post('/api/auth/login-pin', async (req, res) => {
    const { role, pin } = req.body;
    log(`Login attempt: role=${role}, pin=${pin?.replace(/./g, '*')}`);

    if (!role || !pin) return res.status(400).json({ error: "Role and PIN are required" });

    try {
        // If they select 'Karyawan', we also allow other staff roles like 'Barista'
        let userQuery;
        if (role === 'Karyawan') {
            userQuery = await db.query.users.findFirst({
                where: and(
                    or(eq(users.role, 'Karyawan'), eq(users.role, 'Barista')),
                    eq(users.pin, pin)
                )
            });
        } else {
            userQuery = await db.query.users.findFirst({
                where: and(eq(users.role, role), eq(users.pin, pin))
            });
        }
        
        const foundUser = userQuery;

        if (!foundUser) {
            log(`Login failed: role=${role}, pin incorrect or user not found`);
            return res.status(401).json({ error: "PIN atau Peran salah" });
        }

        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const hashedToken = crypto.createHash('sha256').update(sessionId).digest('hex');

        await db.insert(sessions).values({
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
            secure: process.env.NODE_ENV === 'production', // Must be true for cross-origin
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-origin
            expires: expiresAt,
            path: '/'
        });

        log(`Session created for user ${foundUser.id}`);
        res.json({ user: foundUser, session: { id: sessionId, expiresAt } });
    } catch (err: any) {
        log(`PIN Auth Error: ${err.message}`);
        res.status(500).json({ error: "Gagal memproses login" });
    }
});

app.get('/api/auth/session', async (req, res) => {
    const session = await getSessionManually(req);
    return res.json(session);
});

app.post('/api/auth/logout-manual', (req, res) => {
    res.clearCookie('better-auth.session_token', { 
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ success: true });
});

app.get('/api/auth', (req, res) => res.send("Auth API is active."));
app.use("/api/auth", toNodeHandler(auth));

import { inventoryRouter } from './routes/inventory';
import { recipesRouter } from './routes/recipes';
import { salesRouter } from './routes/sales';
import { financeRouter } from './routes/finance';
import { usersRouter } from './routes/users';
import { auditRouter } from './routes/audit';

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

app.use('/api/inventory', inventoryRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/finance', financeRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit', auditRouter);

// --- 8. Error Handling (Express 5 style) ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
