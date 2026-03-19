"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogs = exports.expenses = exports.saleItems = exports.sales = exports.shifts = exports.recipeIngredients = exports.recipes = exports.stockMovements = exports.inventory = exports.suppliers = exports.verifications = exports.accounts = exports.sessions = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// -----------------------------------------------------------------------------
// 1. AUTH & USERS (Better Auth Integration)
// -----------------------------------------------------------------------------
exports.users = (0, pg_core_1.pgTable)('user', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    emailVerified: (0, pg_core_1.boolean)('emailVerified').notNull(),
    image: (0, pg_core_1.text)('image'),
    role: (0, pg_core_1.text)('role').default('Barista').notNull(),
    createdAt: (0, pg_core_1.timestamp)('createdAt').notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updatedAt').notNull()
});
exports.sessions = (0, pg_core_1.pgTable)('session', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    expiresAt: (0, pg_core_1.timestamp)('expiresAt').notNull(),
    ipAddress: (0, pg_core_1.text)('ipAddress'),
    userAgent: (0, pg_core_1.text)('userAgent'),
    userId: (0, pg_core_1.text)('userId').notNull().references(() => exports.users.id)
});
exports.accounts = (0, pg_core_1.pgTable)('account', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    accountId: (0, pg_core_1.text)('accountId').notNull(),
    providerId: (0, pg_core_1.text)('providerId').notNull(),
    userId: (0, pg_core_1.text)('userId').notNull().references(() => exports.users.id),
    accessToken: (0, pg_core_1.text)('accessToken'),
    refreshToken: (0, pg_core_1.text)('refreshToken'),
    idToken: (0, pg_core_1.text)('idToken'),
    expiresAt: (0, pg_core_1.timestamp)('expiresAt'),
    password: (0, pg_core_1.text)('password')
});
exports.verifications = (0, pg_core_1.pgTable)('verification', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    identifier: (0, pg_core_1.text)('identifier').notNull(),
    value: (0, pg_core_1.text)('value').notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expiresAt').notNull()
});
// -----------------------------------------------------------------------------
// 2. INVENTORY TRACKER
// -----------------------------------------------------------------------------
exports.suppliers = (0, pg_core_1.pgTable)('suppliers', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    contact: (0, pg_core_1.text)('contact'),
    address: (0, pg_core_1.text)('address'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
exports.inventory = (0, pg_core_1.pgTable)('inventory', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    category: (0, pg_core_1.text)('category').notNull(),
    unit: (0, pg_core_1.text)('unit').notNull(), // g, L, pcs
    currentStock: (0, pg_core_1.decimal)('current_stock', { precision: 12, scale: 2 }).notNull().default('0'), // Supports fractions like 1.5L
    minStock: (0, pg_core_1.decimal)('min_stock', { precision: 12, scale: 2 }).notNull().default('0'),
    pricePerUnit: (0, pg_core_1.decimal)('price_per_unit', { precision: 12, scale: 2 }).notNull().default('0'),
    imageUrl: (0, pg_core_1.text)('image_url')
});
exports.stockMovements = (0, pg_core_1.pgTable)('stock_movements', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    inventoryId: (0, pg_core_1.integer)('inventory_id').notNull().references(() => exports.inventory.id),
    supplierId: (0, pg_core_1.integer)('supplier_id').references(() => exports.suppliers.id),
    type: (0, pg_core_1.text)('type').notNull(), // 'IN', 'OUT', 'WASTE', 'OPNAME_ADJUSTMENT'
    quantity: (0, pg_core_1.decimal)('quantity', { precision: 12, scale: 2 }).notNull(),
    reason: (0, pg_core_1.text)('reason'), // e.g. 'Expired', 'Spillage', 'Roasting Shrinkage'
    expiryDate: (0, pg_core_1.timestamp)('expiry_date'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
// -----------------------------------------------------------------------------
// 3. RECIPES & BOM (Bill of Materials)
// -----------------------------------------------------------------------------
exports.recipes = (0, pg_core_1.pgTable)('recipes', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    category: (0, pg_core_1.text)('category').notNull(),
    price: (0, pg_core_1.decimal)('price', { precision: 12, scale: 2 }).notNull().default('0'),
    margin: (0, pg_core_1.decimal)('margin', { precision: 5, scale: 2 }).notNull().default('0'), // Percentage 0-100
    imageUrl: (0, pg_core_1.text)('image_url'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull()
});
exports.recipeIngredients = (0, pg_core_1.pgTable)('recipe_ingredients', {
    recipeId: (0, pg_core_1.integer)('recipe_id').notNull().references(() => exports.recipes.id),
    inventoryId: (0, pg_core_1.integer)('inventory_id').notNull().references(() => exports.inventory.id),
    quantity: (0, pg_core_1.decimal)('quantity', { precision: 12, scale: 2 }).notNull() // Usage per serving
});
// -----------------------------------------------------------------------------
// 4. POS SALES & FINANCE TRACKER
// -----------------------------------------------------------------------------
exports.shifts = (0, pg_core_1.pgTable)('shifts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').notNull().references(() => exports.users.id),
    startTime: (0, pg_core_1.timestamp)('start_time').defaultNow().notNull(),
    endTime: (0, pg_core_1.timestamp)('end_time'),
    initialCash: (0, pg_core_1.decimal)('initial_cash', { precision: 12, scale: 2 }).notNull(),
    totalCashExpected: (0, pg_core_1.decimal)('total_cash_expected', { precision: 12, scale: 2 }).default('0'),
    totalCashActual: (0, pg_core_1.decimal)('total_cash_actual', { precision: 12, scale: 2 }).default('0'),
    discrepancy: (0, pg_core_1.decimal)('discrepancy', { precision: 12, scale: 2 }).default('0')
});
exports.sales = (0, pg_core_1.pgTable)('sales', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    shiftId: (0, pg_core_1.integer)('shift_id').notNull().references(() => exports.shifts.id),
    userId: (0, pg_core_1.text)('user_id').notNull().references(() => exports.users.id), // Cashier
    subTotal: (0, pg_core_1.decimal)('sub_total', { precision: 12, scale: 2 }).notNull(),
    taxAmount: (0, pg_core_1.decimal)('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'), // e.g. PB1 10%
    serviceChargeAmount: (0, pg_core_1.decimal)('service_charge_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    totalAmount: (0, pg_core_1.decimal)('total_amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: (0, pg_core_1.text)('payment_method').notNull(), // 'CASH', 'QRIS', 'CARD'
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
exports.saleItems = (0, pg_core_1.pgTable)('sale_items', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    saleId: (0, pg_core_1.integer)('sale_id').notNull().references(() => exports.sales.id),
    recipeId: (0, pg_core_1.integer)('recipe_id').notNull().references(() => exports.recipes.id),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    subtotal: (0, pg_core_1.decimal)('subtotal', { precision: 12, scale: 2 }).notNull()
});
exports.expenses = (0, pg_core_1.pgTable)('expenses', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    title: (0, pg_core_1.text)('title').notNull(),
    category: (0, pg_core_1.text)('category').notNull(), // 'Bahan Baku', 'Operasional', 'Pemeliharaan'
    amount: (0, pg_core_1.decimal)('amount', { precision: 12, scale: 2 }).notNull(),
    receiptUrl: (0, pg_core_1.text)('receipt_url'),
    expenseDate: (0, pg_core_1.timestamp)('expense_date').defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
// -----------------------------------------------------------------------------
// 5. AUDIT LOGS
// -----------------------------------------------------------------------------
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').notNull().references(() => exports.users.id),
    action: (0, pg_core_1.text)('action').notNull(), // e.g. 'UPDATE_RECIPE_PRICE', 'STOCK_MANUAL_ADJUST'
    tableName: (0, pg_core_1.text)('table_name').notNull(),
    oldData: (0, pg_core_1.text)('old_data'), // Stored as JSON string representation
    newData: (0, pg_core_1.text)('new_data'), // Stored as JSON string representation
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
