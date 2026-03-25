/**
 * apps/shared/services/inventoryService.ts
 *
 * Typed service layer for all /api/inventory endpoints.
 * Each function maps 1-to-1 with a backend route.
 */

import { apiFetch, type ApiResponse } from '../apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Service functions ──────────────────────────────────────────────────────────

export const inventoryService = {
    /** GET /api/inventory — list items with optional search and targeted IDs */
    fetchAll: (search?: string, ids?: string) => {
        let url = '/inventory';
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (ids) params.append('ids', ids);
        const query = params.toString();
        return apiFetch<ApiResponse<InventoryItem>>(query ? `${url}?${query}` : url);
    },

    /** GET /api/inventory/:id/movements — last 20 movements for an item */
    fetchMovements: (id: number) =>
        apiFetch<StockMovement[]>(`/inventory/${id}/movements`),

    /** GET /api/inventory/movements/in — general restock history */
    fetchStockInHistory: () =>
        apiFetch<StockInHistoryItem[]>('/inventory/movements/in'),

    /** GET /api/inventory/waste/summary — 30-day waste summary */
    fetchWasteSummary: () =>
        apiFetch<WasteSummary>('/inventory/waste/summary'),

    /** GET /api/inventory/:id/waste — waste logs for a specific item */
    fetchItemWaste: (id: number) =>
        apiFetch<StockMovement[]>(`/inventory/${id}/waste`),

    /** POST /api/inventory — create new inventory item */
    create: (data: CreateInventoryItemPayload) =>
        apiFetch<InventoryItem>('/inventory', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /** PUT /api/inventory/:id — update item master data */
    update: (id: number, data: UpdateInventoryItemPayload) =>
        apiFetch<InventoryItem>(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /** POST /api/inventory/:id/movement — record a stock movement (IN/OUT/WASTE) */
    recordMovement: (id: number, data: RecordMovementPayload) =>
        apiFetch<{ success: boolean; message: string }>(`/inventory/${id}/movement`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
