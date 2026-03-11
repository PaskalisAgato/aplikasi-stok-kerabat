import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { auth } from './config/auth';
import { toNodeHandler } from "better-auth/node";

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Core Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Secure origin in production
    credentials: true,
}));
app.use(express.json()); // Parse JSON payloads

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

import { inventoryRouter } from './routes/inventory';
import { recipesRouter } from './routes/recipes';
import { salesRouter } from './routes/sales';
import { financeRouter } from './routes/finance';

// 3. Application Routes (Placeholders)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Kerabat Backend API is running' });
});

// Mount Routes
app.use('/api/inventory', inventoryRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/finance', financeRouter);

// 4. Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Server Error]: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Kerabat Backend is running on http://localhost:${PORT}`);
    console.log(`Auth endpoints ready at http://localhost:${PORT}/api/auth`);
});
