import Dexie, { type Table } from 'dexie';

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
  // Phase 8: Multi-outlet ready
  outlet_id?: string;
  device_id?: string;
  cashier_id?: string;
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
  version: number; // Phase 8: Data drift protection
}

export interface OfflineCart {
    id: string; // 'current_cart'
    items: any[];
    updatedAt: string;
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
    change_due?: number; // synced with existing code
    cashier_id?: string;
}

export class PosDatabase extends Dexie {
  transactions!: Table<OfflineTransaction>;
  inventoryCache!: Table<InventoryCache>;
  cart!: Table<OfflineCart>;
  printQueue!: Table<OfflinePrintJob>;
  settings!: Table<{ id: string, value: any }>;
  auditLog!: Table<AuditLog>;
  diagnostics!: Table<DiagnosticLog>;

  constructor() {
    super('PosDatabase');
    this.version(4).stores({
      transactions: 'id, receipt_number, sync_status, created_at, outlet_id',
      inventoryCache: 'id, name, status, category, updatedAt, version',
      cart: 'id',
      printQueue: 'id, status, created_at',
      settings: 'id',
      auditLog: '++id, action, entity, timestamp',
      diagnostics: '++id, level, module, timestamp'
    });
  }
}

export const db = new PosDatabase();
