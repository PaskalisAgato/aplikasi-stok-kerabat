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
    externalImage: text('external_image_url'),
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
    idealStock: decimal('ideal_stock', { precision: 12, scale: 2 }).notNull().default('0'),
    pricePerUnit: decimal('price_per_unit', { precision: 12, scale: 2 }).notNull().default('0'),
    discountPrice: decimal('discount_price', { precision: 12, scale: 2 }).notNull().default('0'),
    containerWeight: decimal('container_weight', { precision: 12, scale: 2 }).notNull().default('0'),
    containerId: integer('container_id').references((): any => containers.id), // New: Link to container master
    imageUrl: text('image_url'),
    externalImageUrl: text('external_image_url'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    version: timestamp('version').defaultNow().notNull(), // For concurrency control
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    createdIdx: index('inventory_created_at_idx').on(t.createdAt),
    stockIdx: index('inventory_stock_idx').on(t.currentStock), // New: Speed up status filtering
    minStockIdx: index('inventory_min_stock_idx').on(t.minStock), // New: Speed up status filtering
    isDeletedIdx: index('inventory_is_deleted_idx').on(t.isDeleted) // New: Speed up active filtering
}));

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
    supplierIdx: index('stock_movements_supplier_idx').on(t.supplierId),
    createdIdx: index('stock_movements_created_at_idx').on(t.createdAt)
}));

export const containers = pgTable('containers', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    tareWeight: decimal('tare_weight', { precision: 12, scale: 2 }).notNull(),
    isLocked: boolean('is_locked').default(false).notNull(),
    qrCode: text('qr_code').unique(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const inventorySnapshots = pgTable('inventory_snapshots', {
    id: serial('id').primaryKey(),
    inventoryId: integer('inventory_id').notNull().references(() => inventory.id),
    grossWeight: decimal('gross_weight', { precision: 12, scale: 2 }).notNull(),
    tareWeight: decimal('tare_weight', { precision: 12, scale: 2 }).notNull(),
    netWeight: decimal('net_weight', { precision: 12, scale: 2 }).notNull(),
    measuredBy: text('measured_by').notNull().references(() => users.id),
    source: text('source').default('MANUAL').notNull(), // 'MANUAL', 'SCALE', 'QR'
    timestamp: timestamp('timestamp').defaultNow().notNull()
}, (t: any) => ({
    inventoryIdx: index('snapshots_inventory_idx').on(t.inventoryId),
    timeIdx: index('snapshots_timestamp_idx').on(t.timestamp)
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
    overhead: decimal('overhead', { precision: 5, scale: 2 }).notNull().default('10'), // Percentage 0-100
    imageUrl: text('image_url'),
    externalImageUrl: text('external_image_url'),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0'), // HPP
    isDeleted: boolean('is_deleted').default(false).notNull(),
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

// Member Loyalty System
export const members = pgTable('members', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull().unique(),
    email: text('email'),
    points: integer('points').default(0).notNull(),
    level: text('level').default('bronze').notNull(), // 'bronze', 'silver', 'gold'
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    phoneIdx: index('members_phone_idx').on(t.phone),
    nameIdx: index('members_name_idx').on(t.name)
}));

// Discount System
export const discounts = pgTable('discounts', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'percent', 'nominal', 'bundling', 'time-based', 'member'
    value: decimal('value', { precision: 12, scale: 2 }).notNull().default('0'), // percent or nominal amount
    conditions: text('conditions'), // JSON: { days, startHour, endHour, productIds, minLevel }
    isActive: boolean('is_active').default(true).notNull(),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    typeIdx: index('discounts_type_idx').on(t.type),
    activeIdx: index('discounts_active_idx').on(t.isActive)
}));

export const shifts = pgTable('shifts', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    initialCash: decimal('initial_cash', { precision: 12, scale: 2 }).notNull(),
    expectedCash: decimal('expected_cash', { precision: 12, scale: 2 }).default('0').notNull(),
    expectedNonCash: decimal('expected_non_cash', { precision: 12, scale: 2 }).default('0').notNull(),
    totalCashActual: decimal('total_cash_actual', { precision: 12, scale: 2 }).default('0'),
    totalNonCashActual: decimal('total_non_cash_actual', { precision: 12, scale: 2 }).default('0'),
    discrepancy: decimal('discrepancy', { precision: 12, scale: 2 }).default('0'),
    status: text('status').default('OPEN').notNull(), // 'OPEN', 'CLOSED'
    cashierNotes: text('cashier_notes'),
    totalSalesCount: integer('total_sales_count').default(0).notNull(),
    totalItemsSold: integer('total_items_sold').default(0).notNull(),
    ledgerSnapshot: text('ledger_snapshot'), // New: Immutable JSON snapshot of accounting state at closing
    isDeleted: boolean('is_deleted').default(false).notNull(),
}, (t: any) => ({
    userIdx: index('shifts_user_idx').on(t.userId),
    statusIdx: index('shifts_status_idx').on(t.status),
    isDeletedIdx: index('shifts_is_deleted_idx').on(t.isDeleted)
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
    paymentStatus: text('payment_status').default('success').notNull(), // 'success', 'pending', 'failed'
    status: text('status').default('PAID').notNull(), // 'OPEN', 'PAID', 'CANCELLED'
    customerInfo: text('customer_info'), // Table number or Name
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    discountType: text('discount_type'), // 'PERCENT', 'FIXED'
    isVoided: boolean('is_voided').default(false).notNull(),
    voidReason: text('void_reason'),
    voidedBy: text('voided_by').references(() => users.id),
    voidedAt: timestamp('voided_at'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    offlineId: text('offline_id').unique(),
    paymentReferenceId: text('payment_reference_id'), // New: Proof for Non-Cash (e.g. Card/QRIS Ref Number)
    // Member & Loyalty fields
    memberId: integer('member_id').references((): any => members.id),
    discountId: integer('discount_id').references((): any => discounts.id),
    discountTotal: decimal('discount_total', { precision: 12, scale: 2 }).default('0').notNull(),
    pointsUsed: integer('points_used').default(0).notNull(),
    pointsEarned: integer('points_earned').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    shiftIdx: index('sales_shift_idx').on(t.shiftId),
    userIdx: index('sales_user_idx').on(t.userId),
    createdIdx: index('sales_created_at_idx').on(t.createdAt),
    voidIdx: index('sales_is_voided_idx').on(t.isVoided)
}));

export const saleItems = pgTable('sale_items', {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id').notNull().references(() => sales.id),
    recipeId: integer('recipe_id').notNull().references(() => recipes.id),
    quantity: integer('quantity').notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
    notes: text('notes'),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }).notNull().default('0') // Capture HPP at time of sale
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
    userId: text('user_id').references(() => users.id),
    shiftId: integer('shift_id').references(() => shifts.id), // Link to shift
    receiptUrl: text('receipt_url'),
    externalReceiptUrl: text('external_receipt_url'),
    expenseDate: timestamp('expense_date').defaultNow().notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    fundSource: text('fund_source').default('CASHIER').notNull(), // 'CASHIER' or 'OWNER'
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    createdIdx: index('expenses_created_at_idx').on(t.createdAt),
    userIdx: index('expenses_user_id_idx').on(t.userId),
    shiftIdx: index('expenses_shift_id_idx').on(t.shiftId),
    expenseDateIdx: index('expenses_expense_date_idx').on(t.expenseDate)
}));

export const cashLedger = pgTable('cash_ledger', {
    id: serial('id').primaryKey(),
    shiftId: integer('shift_id').notNull().references(() => shifts.id),
    type: text('type').notNull(), // 'sale', 'refund', 'expense', 'handover'
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    referenceId: integer('reference_id'), // Pointer to sales, expenses, etc.
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    shiftIdx: index('cash_ledger_shift_idx').on(t.shiftId)
}));

export const voidLogs = pgTable('void_logs', {
    id: serial('id').primaryKey(),
    transactionId: integer('transaction_id').notNull().references(() => sales.id),
    userId: text('user_id').notNull().references(() => users.id),
    reason: text('reason').notNull(),
    approvedBy: text('approved_by').references(() => users.id), // Admin pinning
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const shiftHandover = pgTable('shift_handover', {
    id: serial('id').primaryKey(),
    shiftFrom: integer('shift_from').notNull().references(() => shifts.id),
    shiftTo: integer('shift_to').notNull().references(() => shifts.id),
    cashAmount: decimal('cash_amount', { precision: 12, scale: 2 }).notNull(),
    approvedBy1: text('approved_by_1').notNull().references(() => users.id), // Outgoing cashier
    approvedBy2: text('approved_by_2').notNull().references(() => users.id), // Incoming cashier
    timestamp: timestamp('timestamp').defaultNow().notNull()
});

export const shiftCashDenominations = pgTable('shift_cash_denominations', {
    id: serial('id').primaryKey(),
    shiftId: integer('shift_id').notNull().references(() => shifts.id),
    nominal: integer('nominal').notNull(),
    qty: integer('qty').notNull(),
    total: decimal('total', { precision: 12, scale: 2 }).notNull(),
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
    externalCheckInPhoto: text('external_check_in_photo'),
    externalCheckOutPhoto: text('external_check_out_photo'),
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
    category: text('category').notNull(), // 'Opening', 'Closing', 'Request', 'RUTIN'
    assignedTo: text('assigned_to').references(() => users.id), // Optional: individual assignment
    status: text('status').default('Pending').notNull(), // 'Pending', 'Completed'
    photoProof: text('photo_proof'), // Base64 or URL
    externalPhotoProof: text('external_photo_proof'),
    completionTime: timestamp('completion_time'),
    completedBy: text('completed_by').references(() => users.id),
    createdBy: text('created_by').notNull().references(() => users.id),
    isRecurring: boolean('is_recurring').default(false).notNull(),
    intervalType: text('interval_type'), // 'daily', 'weekly', 'monthly', 'custom'
    intervalValue: integer('interval_value'), // e.g., 1 (day), 2 (weeks)
    nextRunAt: timestamp('next_run_at'),
    deadline: timestamp('deadline'),
    photoUploadMode: text('photo_upload_mode').default('both'),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const todoCompletions = pgTable('todo_completions', {
    id: serial('id').primaryKey(),
    todoId: integer('todo_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
    completedBy: text('completed_by').notNull().references(() => users.id),
    photoProof: text('photo_proof'),
    externalPhotoProof: text('external_photo_proof'),
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

export const todoSettings = pgTable('todo_settings', {
    id: serial('id').primaryKey(),
    settingKey: text('setting_key').notNull().unique(), // e.g., 'photo_upload_mode'
    settingValue: text('setting_value').notNull(), // 'camera', 'gallery', 'both'
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// -----------------------------------------------------------------------------
// 9. AUDIT LOGS - PRICE & ECONOMY
// -----------------------------------------------------------------------------
export const inventoryPriceLogs = pgTable('inventory_price_logs', {
    id: serial('id').primaryKey(),
    itemId: integer('item_id').notNull().references(() => inventory.id, { onDelete: 'cascade' }),
    oldPrice: decimal('old_price', { precision: 12, scale: 2 }).notNull(),
    newPrice: decimal('new_price', { precision: 12, scale: 2 }).notNull(),
    oldDiscount: decimal('old_discount', { precision: 12, scale: 2 }).default('0'),
    newDiscount: decimal('new_discount', { precision: 12, scale: 2 }).default('0'),
    changedBy: text('changed_by').notNull().references(() => users.id),
    timestamp: timestamp('timestamp').defaultNow().notNull()
}, (t: any) => ({
    itemIdx: index('price_logs_item_idx').on(t.itemId),
    timeIdx: index('price_logs_timestamp_idx').on(t.timestamp)
}));

// -----------------------------------------------------------------------------
// 10. SYSTEM MONITORING & ENTERPRISE
// -----------------------------------------------------------------------------
export const systemLogs = pgTable('system_logs', {
    id: serial('id').primaryKey(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    responseTime: integer('response_time').notNull(), // in ms
    payloadSize: integer('payload_size').notNull(), // in bytes
    statusCode: integer('status_code').notNull(),
    userId: text('user_id'),
    level: text('level').default('INFO').notNull(), // INFO, WARNING, ERROR
    errorDetails: text('error_details'),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (t: any) => ({
    pathIdx: index('logs_path_idx').on(t.path),
    timeIdx: index('logs_created_at_idx').on(t.createdAt)
}));

export const idempotencyKeys = pgTable('idempotency_keys', {
    key: text('key').primaryKey(),
    responseBody: text('response_body'), // Stored as JSON string
    statusCode: integer('status_code').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const backups = pgTable('backups', {
    id: serial('id').primaryKey(),
    filename: text('filename').notNull(),
    size: integer('size').notNull(),
    status: text('status').notNull(), // 'Success', 'Failed'
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const printJobs = pgTable('print_jobs', {
    id: serial('id').primaryKey(),
    payload: text('payload').notNull(), // JSON string of PrintData
    status: text('status').default('PENDING').notNull(), // 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'
    printerName: text('printer_name'),
    retryCount: integer('retry_count').default(0).notNull(),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at')
}, (t: any) => ({
    statusIdx: index('print_jobs_status_idx').on(t.status)
}));
export const loyaltySettings = pgTable('loyalty_settings', {
    id: serial('id').primaryKey(),
    pointRatio: decimal('point_ratio', { precision: 12, scale: 2 }).notNull().default('10000'), // Rp X = 1 Point
    pointValue: decimal('point_value', { precision: 12, scale: 2 }).notNull().default('100'),  // 1 Point = Rp X
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});
