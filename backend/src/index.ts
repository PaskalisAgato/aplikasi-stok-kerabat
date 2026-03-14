import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { auth } from './config/auth';
import { toNodeHandler } from "better-auth/node";

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Core Middlewares
app.use(cors({
    origin: [process.env.FRONTEND_URL || '*', 'https://paskalisagato.github.io'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON payloads

// 2. Authentication Middleware Integration (Better Auth)
// Mount Better Auth endpoints at /api/auth
app.use("/api/auth", toNodeHandler(auth));

// Custom Auth Middleware that can be attached to protected Routes
export const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: new Headers(req.headers as Record<string, string>)
        });
        
        if (!session) {
            return res.status(401).json({ error: "Unauthorized / Session Expired" });
        }
        
        // Attach user info to request context
        (req as any).user = session.user;
        next();
    } catch (err) {
        res.status(500).json({ error: "Auth Validation Error" });
    }
};

// --- Admin-Only Middleware ---
export const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await requireAuth(req, res, () => {
        const user = (req as any).user;
        if (user && user.role === 'Admin') {
            next();
        } else {
            res.status(403).json({ error: "Akses ditolak. Fitur ini hanya untuk Admin." });
        }
    });
};

import { inventoryRouter } from './routes/inventory';
import { recipesRouter } from './routes/recipes';
import { salesRouter } from './routes/sales';
import { financeRouter } from './routes/finance';
import { usersRouter } from './routes/users';

// 3. Application Routes (Placeholders)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Kerabat Backend API is running' });
});

// Mount Routes
app.use('/api/inventory', inventoryRouter); // Both can access
app.use('/api/recipes', recipesRouter); // Both can access
app.use('/api/sales', salesRouter); // Both can access
app.use('/api/finance', financeRouter); // Protected internally
app.use('/api/users', usersRouter); // Protected internally via requireAdmin

// --- PIN Authentication Endpoint ---
import { db } from './db';
import { users, sessions } from './db/schema';
import { eq, and } from 'drizzle-orm';

app.post('/api/auth/login-pin', async (req, res) => {
    const { role, pin } = req.body;

    if (!role || !pin) {
        return res.status(400).json({ error: "Role and PIN are required" });
    }

    try {
        // Find user by role and pin
        // Note: In production, pins should be hashed. For this simplicity request, we compare directly or use role-based fixed accounts.
        const foundUser = await db.query.users.findFirst({
            where: and(eq(users.role, role), eq(users.pin, pin))
        });

        if (!foundUser) {
            return res.status(401).json({ error: "PIN atau Peran salah" });
        }

        // Create a session for the user manually
        // Since better-auth handles sessions in its own table, we can create one.
        const sessionId = Math.random().toString(36).substring(7) + Date.now();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.insert(sessions).values({
            id: sessionId,
            userId: foundUser.id,
            expiresAt: expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Set session cookie manually so the frontend authClient can pick it up
        // Better Auth typically looks for 'better-auth.session_token'
        res.cookie('better-auth.session_token', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/'
        });

        res.json({ user: foundUser, session: { id: sessionId, expiresAt } });
    } catch (err: any) {
        console.error("PIN Auth Error:", err);
        res.status(500).json({ error: "Gagal memproses login" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Kerabat Backend is running on http://localhost:${PORT}`);
    console.log(`Auth endpoints ready at http://localhost:${PORT}/api/auth`);
});
