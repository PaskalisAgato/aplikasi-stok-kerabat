import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './config/auth';

// Route Imports
import { productRoutes } from './routes/product.routes';
import { transactionRoutes } from './routes/transaction.routes';
import { userRoutes } from './routes/user.routes';
import { inventoryRouter } from './routes/inventory';
import { financeRouter } from './routes/finance';
import { auditRouter } from './routes/audit';

// Middleware Imports
import { errorHandler } from './middleware/error.middleware';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';

const app = express();

// Global Logger (Temporary for Debugging)
app.use((req, res, next) => {
    console.log(`[IncomingRequest] ${req.method} ${req.originalUrl} - Path: ${req.path}`);
    next();
});

// 1. Global Middlewares
app.use(cors({
    origin: true, // Allow all origins during debugging to rule out CORS as the cause of "Koneksi Terhambat"
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// 2. Health & Diag
app.get('/api/health', async (req, res) => {
    let dbStatus = 'waiting';
    try {
        await UserService.getAllUsers();
        dbStatus = 'connected';
    } catch (e: any) {
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
app.post('/api/auth/login-pin', UserController.loginByPin);

// 4. API Routes (Products, Transactions, etc.)
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRouter);
app.use('/api/finance', financeRouter);
app.use('/api/audit', auditRouter);

// 5. Better Auth Managed Endpoints
// Using manual prefix check to avoid PathError while keeping routing reliable
app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
        console.log(`[BetterAuthHandover] Path: ${req.path}, Method: ${req.method}`);
        return toNodeHandler(auth)(req, res);
    }
    next();
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
app.use(errorHandler);

export default app;
