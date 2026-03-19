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

const app = express();

// 1. Global Middlewares
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://paskalisagato.github.io'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(o => o.trim()).filter(Boolean));
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie']
}));

// Explicitly handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());

// 2. Auth Endpoint
app.use("/api/auth", toNodeHandler(auth));

// 3. Health & Diag
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Kerabat Modular Backend v1.0.0 is running' });
});

// 4. API Routes
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRouter);
app.use('/api/finance', financeRouter);
app.use('/api/audit', auditRouter);

// 5. Error Handler
app.use(errorHandler);

export default app;
