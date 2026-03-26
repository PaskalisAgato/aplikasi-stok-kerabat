/**
 * apps/shared/services/inventoryService.ts
 *
 * Typed service layer for all /api/inventory endpoints.
 * Each function maps 1-to-1 with a backend route.
 */
import { type ApiResponse } from '../apiClient';
export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    unit: string;
    currentStock: string;
    systemStock?: string;
    minStock: string;
    pricePerUnit: string;
    discountPrice?: string;
    imageUrl?: string | null;
    supplier?: string;
    status: 'NORMAL' | 'KRITIS' | 'HABIS';
    createdAt?: string;
}
export interface StockMovement {
    id: number;
    type: 'IN' | 'OUT' | 'WASTE' | 'OPNAME_ADJUSTMENT';
    quantity: string;
    reason?: string;
    supplierName?: string;
    createdAt: string;
}
export interface StockInHistoryItem {
    id: number;
    inventoryName: string;
    quantity: string;
    unit: string;
    supplierName?: string;
    reason?: string;
    createdAt: string;
}
export interface WasteSummary {
    totalValueMonth: number;
    topOffenders: Array<{
        id: number;
        name: string;
        unit: string;
        currentStock: string;
        totalWasteValue: number;
    }>;
}
export interface CreateInventoryItemPayload {
    name: string;
    category: string;
    unit: string;
    minStock?: number | string;
    pricePerUnit?: number | string;
    discountPrice?: number | string;
    imageUrl?: string;
}
export interface UpdateInventoryItemPayload {
    name?: string;
    category?: string;
    unit?: string;
    minStock?: number | string;
    imageUrl?: string;
}
export interface RecordMovementPayload {
    type: 'IN' | 'OUT' | 'WASTE' | 'OPNAME_ADJUSTMENT';
    quantity: number | string;
    reason?: string;
    supplierId?: number;
    supplierName?: string;
    expiryDate?: string;
    createdAt?: string;
}
export declare const inventoryService: {
    /** GET /api/inventory — list items with optional search and targeted IDs */
    fetchAll: (search?: string, ids?: string) => Promise<ApiResponse<InventoryItem>>;
    /** GET /api/inventory/:id/movements — last 20 movements for an item */
    fetchMovements: (id: number) => Promise<StockMovement[]>;
    /** GET /api/inventory/movements/in — general restock history */
    fetchStockInHistory: () => Promise<StockInHistoryItem[]>;
    /** GET /api/inventory/waste/summary — 30-day waste summary */
    fetchWasteSummary: () => Promise<WasteSummary>;
    /** GET /api/inventory/:id/waste — waste logs for a specific item */
    fetchItemWaste: (id: number) => Promise<StockMovement[]>;
    /** POST /api/inventory — create new inventory item */
    create: (data: CreateInventoryItemPayload) => Promise<InventoryItem>;
    /** PUT /api/inventory/:id — update item master data */
    update: (id: number, data: UpdateInventoryItemPayload) => Promise<InventoryItem>;
    /** POST /api/inventory/:id/movement — record a stock movement (IN/OUT/WASTE) */
    recordMovement: (id: number, data: RecordMovementPayload) => Promise<{
        success: boolean;
        message: string;
    }>;
};
