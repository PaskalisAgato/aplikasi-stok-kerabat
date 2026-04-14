import Dexie, { type Table } from 'dexie';

// DEPRECATED: Retained only for migrating old offline data if any.
// DO NOT USE FOR NEW TRANSACTIONS.
export interface OfflineTransaction {
  id: string; // UUID v4
  receipt_number: string;
  total_amount: number;
  payment_method: 'CASH' | 'QRIS' | 'TRANSFER';
  items: any[];
  created_at: string;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
  retry_count: number;
  errorMessage?: string;
  status?: 'OPEN' | 'PAID' | 'CANCELLED';
  customer_info?: string;
  outlet_id?: string;
  device_id?: string;
  cashier_id?: string;
}

// THE NEW ENTERPRISE SYNC ARCHITECTURE
export interface OfflineAction {
  id: string; // Internal IndexedDB UUID or hash
  sequence_number?: number; // Auto-incrementing local ID for strict FIFO execution
  idempotency_key: string; // UUID v4 ensuring backend never double-processes this action
  type: 'CHECKOUT' | 'VOID' | 'EXPENSE' | 'SHIFT_HANDOVER' | 'SHIFT_CLOSE' | 'ENQUEUE_PRINT' | 'DELETE_TRANSACTION' | 'ADD_ITEMS_TO_BILL';
  payload: any; // The request body parameters
  created_at: string; // Local timestamp (but Backend will re-verify server time)
  sync_status: 'PENDING' | 'SYNCED' | 'REJECTED' | 'FAILED_PERMANENT' | 'HALTED'; // REJECTED = pure logic failure, HALTED = blocks queue
  retry_count: number;
  failure_reason?: string;
  last_attempt_at?: string;
  depends_on_action_id?: string; // E.g., a VOID depends on the CHECKOUT action succeeding first to prevent Async Desyncs
}

export interface InventoryCache {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  minStock: string;
  pricePerUnit: string;
  status: 'NORMAL' | 'KRITIS' | 'HABIS';
  updatedAt: string;
  version: number; 
}

export interface OfflineCart {
    id: string; // 'current_cart'
    items: any[];
    updatedAt: string;
    customerInfo?: string;
    currentBillId?: string | number; 
}

export interface OfflinePrintJob {
  id: string; // UUID or timestamp
  data: any; // PrintData
  status: 'PENDING' | 'DONE' | 'FAILED';
  retry_count: number;
  last_error?: string;
  created_at: string;
}

export interface AuditLog {
    id?: number;
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    userId: string;
    deviceId: string;
}

export interface DiagnosticLog {
    id?: number;
    level: 'INFO' | 'WARN' | 'ERROR';
    module: string;
    message: string;
    timestamp: string;
}

export interface PrinterConfig {
    id: string;
    name: string;
    ip?: string; 
    port: number;
    width: 32 | 48;
    categories: string[]; 
    connectionType: 'bridge' | 'bluetooth';
    bluetoothDeviceName?: string;
    autoPrint?: boolean;
    openCashDrawer?: boolean;
    headerTitle?: string;
    headerSubtitle?: string;
    footerMessage?: string;
    showLogo?: boolean;
    showDate?: boolean;
    showCashier?: boolean;
}

export interface PrintItem {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    category?: string;
}

export interface PrintData {
    id: string | number;
    date: string;
    items: PrintItem[];
    total: number;
    paymentMethod: string;
    amountPaid?: number;
    change_due?: number; 
    cashier_id?: string;
}

export class PosDatabase extends Dexie {
  transactions!: Table<OfflineTransaction>; // Deprecated
  offlineActions!: Table<OfflineAction>; // Enterprise Polymorphic Queue
  inventoryCache!: Table<InventoryCache>;
  cart!: Table<OfflineCart>;
  printQueue!: Table<OfflinePrintJob>;
  settings!: Table<{ id: string, value: any }>;
  auditLog!: Table<AuditLog>;
  diagnostics!: Table<DiagnosticLog>;

  constructor() {
    super('PosDatabase');
    // Bump version to 6 for the new schema
    this.version(6).stores({
      transactions: 'id, receipt_number, sync_status, created_at, outlet_id, status, customer_info',
      offlineActions: '++sequence_number, id, idempotency_key, sync_status, type, depends_on_action_id',
      inventoryCache: 'id, name, status, category, updatedAt, version',
      cart: 'id, currentBillId',
      printQueue: 'id, status, created_at',
      settings: 'id',
      auditLog: '++id, action, entity, timestamp',
      diagnostics: '++id, level, module, timestamp'
    });
  }
}

export const db = new PosDatabase();
