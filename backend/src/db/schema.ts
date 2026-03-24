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
    status: text('status').default('active').notNull(),
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
}, (t: any) => ({
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
}, (t: any) => ({
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
}, (t: any) => ({
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
}, (t: any) => ({
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
}, (t: any) => ({
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
}, (t: any) => ({
    shiftIdx: index('sales_shift_idx').on(t.shiftId),
    userIdx: index('sales_user_idx').on(t.userId)
}));

export const saleItems = pgTable('sale_items', {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id').notNull().references(() => sales.id),
    recipeId: integer('recipe_id').notNull().references(() => recipes.id),
    quantity: integer('quantity').notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull()
}, (t: any) => ({
    saleIdx: index('sale_items_sale_idx').on(t.saleId),
    recipeIdx: index('sale_items_recipe_idx').on(t.recipeId)
}));

export const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    vendor: text('vendor'), // New: Vendor name
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
}, (t: any) => ({
    userIdx: index('audit_logs_user_idx').on(t.userId)
}));

// -----------------------------------------------------------------------------
// 6. WORK SHIFTS & ATTENDANCE
// -----------------------------------------------------------------------------
export const shiftSettings = pgTable('shift_settings', {
    id: serial('id').primaryKey(),
    code: text('code').notNull().unique(), // 'P', 'S', 'M'
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const workShifts = pgTable('work_shifts', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    date: timestamp('date').notNull(),
    startTime: text('start_time').notNull(), // e.g. "08:00"
    endTime: text('end_time').notNull(), // e.g. "17:00"
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').notNull()
}, (t: any) => ({
    userIdx: index('work_shifts_user_idx').on(t.userId),
    dateIdx: index('work_shifts_date_idx').on(t.date)
}));

export const attendance = pgTable('attendance', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    date: timestamp('date').notNull(),
    checkIn: timestamp('check_in'),
    checkOut: timestamp('check_out'),
    checkInPhoto: text('check_in_photo'), // URL to storage
    checkOutPhoto: text('check_out_photo'), // URL to storage
    checkInTimestamp: text('check_in_timestamp'), // Watermark text
    checkOutTimestamp: text('check_out_timestamp'), // Watermark text
    status: text('status').notNull(), // 'Hadir', 'Terlambat', 'Alpha', 'Izin'
    location: text('location'), // Alamat (Address)
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    userIdx: index('attendance_user_idx').on(t.userId),
    dateIdx: index('attendance_date_idx').on(t.date)
}));

export const shiftRequests = pgTable('shift_requests', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    date: timestamp('date').notNull(),
    requestedShift: text('requested_shift').notNull(), // 'P', 'S', 'M', 'OFF'
    reason: text('reason'),
    status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected'
    createdAt: timestamp('created_at').defaultNow().notNull()
});

// -----------------------------------------------------------------------------
// 7. PAYROLL
// -----------------------------------------------------------------------------
export const payroll = pgTable('payroll', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    totalWorkDays: integer('total_work_days').default(0).notNull(),
    totalHours: decimal('total_hours', { precision: 10, scale: 2 }).default('0').notNull(),
    baseSalary: decimal('base_salary', { precision: 12, scale: 2 }).notNull(),
    overtimePay: decimal('overtime_pay', { precision: 12, scale: 2 }).default('0').notNull(),
    deductions: decimal('deductions', { precision: 12, scale: 2 }).default('0').notNull(),
    totalNetSalary: decimal('total_net_salary', { precision: 12, scale: 2 }).notNull(),
    status: text('status').default('draft').notNull(), // 'draft', 'paid'
    createdAt: timestamp('created_at').defaultNow().notNull()
});

// -----------------------------------------------------------------------------
// 8. TO-DO LIST SYSTEM
// -----------------------------------------------------------------------------
export const todos = pgTable('todos', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    category: text('category').notNull(), // 'Opening', 'Closing', 'Request'
    assignedTo: text('assigned_to').references(() => users.id), // Optional: individual assignment
    status: text('status').default('Pending').notNull(), // 'Pending', 'Completed'
    photoProof: text('photo_proof'), // Base64 or URL
    completionTime: timestamp('completion_time'),
    completedBy: text('completed_by').references(() => users.id),
    createdBy: text('created_by').notNull().references(() => users.id),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    deadline: timestamp('deadline'),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const todoCompletions = pgTable('todo_completions', {
    id: serial('id').primaryKey(),
    todoId: integer('todo_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
    completedBy: text('completed_by').notNull().references(() => users.id),
    photoProof: text('photo_proof'),
    completionTime: timestamp('completion_time').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    todoIdx: index('todo_completions_todo_idx').on(t.todoId),
    userIdx: index('todo_completions_user_idx').on(t.completedBy)
}));

export const todosRelations = relations(todos, ({ many }) => ({
    completions: many(todoCompletions)
}));

export const todoCompletionsRelations = relations(todoCompletions, ({ one }) => ({
    todo: one(todos, {
        fields: [todoCompletions.todoId],
        references: [todos.id]
    }),
    user: one(users, {
        fields: [todoCompletions.completedBy],
        references: [users.id]
    })
}));
