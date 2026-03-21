import { pgTable, serial, text, integer, decimal, timestamp, boolean, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// -----------------------------------------------------------------------------
// 1. AUTH & USERS (Better Auth Integration)
// -----------------------------------------------------------------------------
export const users = pgTable('user', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull(),
    image: text('image'),
    role: text('role').default('Karyawan').notNull(), // 'Admin' or 'Karyawan'
    pin: text('pin'), // 4-6 digit numeric PIN
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull()
});

export const sessions = pgTable('session', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull(),
    updatedAt: timestamp('updatedAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId').notNull().references(() => users.id)
}, (t) => ({
    userIdx: index('session_user_idx').on(t.userId)
}));

export const accounts = pgTable('account', {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId').notNull().references(() => users.id),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    expiresAt: timestamp('expiresAt'),
    password: text('password')
}, (t) => ({
    userIdx: index('account_user_idx').on(t.userId)
}));

export const verifications = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull()
});

// -----------------------------------------------------------------------------
// 2. INVENTORY TRACKER
// -----------------------------------------------------------------------------
export const suppliers = pgTable('suppliers', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    contact: text('contact'),
    address: text('address'),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const inventory = pgTable('inventory', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    unit: text('unit').notNull(), // g, L, pcs
    currentStock: decimal('current_stock', { precision: 12, scale: 2 }).notNull().default('0'), // Supports fractions like 1.5L
    minStock: decimal('min_stock', { precision: 12, scale: 2 }).notNull().default('0'),
    pricePerUnit: decimal('price_per_unit', { precision: 12, scale: 2 }).notNull().default('0'),
    discountPrice: decimal('discount_price', { precision: 12, scale: 2 }).notNull().default('0'),
    imageUrl: text('image_url')
});

export const stockMovements = pgTable('stock_movements', {
    id: serial('id').primaryKey(),
    inventoryId: integer('inventory_id').notNull().references(() => inventory.id),
    supplierId: integer('supplier_id').references(() => suppliers.id),
    type: text('type').notNull(), // 'IN', 'OUT', 'WASTE', 'OPNAME_ADJUSTMENT'
    quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
    reason: text('reason'), // e.g. 'Expired', 'Spillage', 'Roasting Shrinkage'
    expiryDate: timestamp('expiry_date'),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
    inventoryIdx: index('stock_movements_inventory_idx').on(t.inventoryId),
    supplierIdx: index('stock_movements_supplier_idx').on(t.supplierId)
}));

// -----------------------------------------------------------------------------
// 3. RECIPES & BOM (Bill of Materials)
// -----------------------------------------------------------------------------
export const recipes = pgTable('recipes', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0'),
    margin: decimal('margin', { precision: 5, scale: 2 }).notNull().default('0'), // Percentage 0-100
    imageUrl: text('image_url'),
    isActive: boolean('is_active').default(true).notNull()
});

export const recipeIngredients = pgTable('recipe_ingredients', {
    recipeId: integer('recipe_id').notNull().references(() => recipes.id),
    inventoryId: integer('inventory_id').notNull().references(() => inventory.id),
    quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull() // Usage per serving
}, (t) => ({
    recipeIdx: index('recipe_ingredients_recipe_idx').on(t.recipeId),
    inventoryIdx: index('recipe_ingredients_inventory_idx').on(t.inventoryId)
}));

// -----------------------------------------------------------------------------
// 4. POS SALES & FINANCE TRACKER
// -----------------------------------------------------------------------------
export const shifts = pgTable('shifts', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    initialCash: decimal('initial_cash', { precision: 12, scale: 2 }).notNull(),
    totalCashExpected: decimal('total_cash_expected', { precision: 12, scale: 2 }).default('0'),
    totalCashActual: decimal('total_cash_actual', { precision: 12, scale: 2 }).default('0'),
    discrepancy: decimal('discrepancy', { precision: 12, scale: 2 }).default('0')
}, (t) => ({
    userIdx: index('shifts_user_idx').on(t.userId)
}));

export const sales = pgTable('sales', {
    id: serial('id').primaryKey(),
    shiftId: integer('shift_id').references(() => shifts.id),
    userId: text('user_id').notNull().references(() => users.id), // Cashier
    subTotal: decimal('sub_total', { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'), // e.g. PB1 10%
    serviceChargeAmount: decimal('service_charge_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull(), // 'CASH', 'QRIS', 'CARD'
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
    shiftIdx: index('sales_shift_idx').on(t.shiftId),
    userIdx: index('sales_user_idx').on(t.userId)
}));

export const saleItems = pgTable('sale_items', {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id').notNull().references(() => sales.id),
    recipeId: integer('recipe_id').notNull().references(() => recipes.id),
    quantity: integer('quantity').notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull()
}, (t) => ({
    saleIdx: index('sale_items_sale_idx').on(t.saleId),
    recipeIdx: index('sale_items_recipe_idx').on(t.recipeId)
}));

export const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull(), // 'Bahan Baku', 'Operasional', 'Pemeliharaan'
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    receiptUrl: text('receipt_url'),
    expenseDate: timestamp('expense_date').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const expenseCategories = pgTable('expense_categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    icon: text('icon').default('category').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

// -----------------------------------------------------------------------------
// 5. AUDIT LOGS
// -----------------------------------------------------------------------------
export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    action: text('action').notNull(), // e.g. 'UPDATE_RECIPE_PRICE', 'STOCK_MANUAL_ADJUST'
    tableName: text('table_name').notNull(),
    oldData: text('old_data'), // Stored as JSON string representation
    newData: text('new_data'), // Stored as JSON string representation
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t) => ({
    userIdx: index('audit_logs_user_idx').on(t.userId)
}));
