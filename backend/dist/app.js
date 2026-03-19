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
const app = (0, express_1.default)();
// 1. Global Middlewares
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://paskalisagato.github.io'
    ],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// 2. Auth Endpoint
app.use("/api/auth", (0, node_1.toNodeHandler)(auth_1.auth));
// 3. Health & Diag
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Kerabat Modular Backend v1.0.0 is running' });
});
// 4. API Routes
app.use('/api/products', product_routes_1.productRoutes);
app.use('/api/transactions', transaction_routes_1.transactionRoutes);
app.use('/api/users', user_routes_1.userRoutes);
app.use('/api/inventory', inventory_1.inventoryRouter);
app.use('/api/finance', finance_1.financeRouter);
app.use('/api/audit', audit_1.auditRouter);
// 5. Error Handler
app.use(error_middleware_1.errorHandler);
exports.default = app;
