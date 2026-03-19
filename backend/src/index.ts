import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// In-memory log buffer for production debugging
const memoryLog: string[] = [];
const MAX_MEMORY_LOGS = 100;
const logPath = path.join(process.cwd(), 'boot.log');

const log = (msg: string) => {
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    
    // Always update memory log
    memoryLog.push(formattedMsg);
    if (memoryLog.length > MAX_MEMORY_LOGS) {
        memoryLog.shift();
    }

    // Only log to file in development (Render's disk is slow/ephemeral)
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    if (!isProd) {
        try {
            if (fs.existsSync(logPath) && fs.statSync(logPath).size > 5 * 1024 * 1024) {
                fs.writeFileSync(logPath, `[${timestamp}] --- LOG TRUNCATED ---\n`);
            }
            fs.appendFileSync(logPath, formattedMsg + '\n');
        } catch (e) {
            // Fallback
        }
    }
    console.log(formattedMsg);
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
        'http://localhost:5184',
        'http://localhost:5186',
        'https://paskalisagato.github.io'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cookie', 
        'Accept', 
        'Origin', 
        'X-Requested-With',
        'X-Auth-Token'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // Cache preflight for 24 hours (helpful for Safari)
};

app.use(cors(corsOptions));
// CORS preflight is already handled by the middleware above

app.use(express.json({ limit: '10mb' }));

// Diagnostic: Log View Route (Remote Debugging)
app.get('/api/logs', (req, res) => {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    
    // In production, prioritize memory logs for speed and reliability
    let content = '--- MEMORY LOGS (Last 100 lines) ---\n' + memoryLog.join('\n');
    
    // In dev, or if memory log is empty, try reading the file
    if (!isProd && fs.existsSync(logPath)) {
        try {
            const stats = fs.statSync(logPath);
            const bufferSize = Math.min(stats.size, 50000);
            const startByte = Math.max(0, stats.size - bufferSize);
            const buffer = Buffer.alloc(bufferSize);
            const fd = fs.openSync(logPath, 'r');
            fs.readSync(fd, buffer, 0, bufferSize, startByte);
            fs.closeSync(fd);
            const fileContent = buffer.toString('utf8').replace(/\u0000/g, '');
            content += '\n\n--- FILE LOGS (boot.log) ---\n' + (startByte > 0 ? '... (truncated)\n' : '') + fileContent;
        } catch (e) {
            content += '\n\n(Error reading boot.log)';
        }
    }
    
    res.header('Content-Type', 'text/plain').send(content);
});

// Request Logger
app.use((req, res, next) => {
    // Only log essential requests in production to save memory/IO
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;
    const isStatic = req.url.includes('.') || req.url.includes('health') || req.url.includes('session');
    
    if (!isProd || !isStatic) {
        log(`${req.method} ${req.url}`);
    }
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

        const isProd = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

        res.cookie('better-auth.session_token', sessionId, {
            httpOnly: true,
            secure: isProd, // Must be true for cross-origin (SameSite=None)
            sameSite: isProd ? 'none' : 'lax', // 'none' required for cross-origin
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
    log(`Incoming session check: ${req.headers.authorization ? 'Has Authorization' : 'No Authorization'}`);
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
