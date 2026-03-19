/**
 * apps/shared/services/salesService.ts
 *
 * Typed service layer for all /api/sales endpoints.
 */

import { apiFetch } from '../apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CartItem {
    recipeId: number;
    quantity: number;
    subtotal: number | string;
}

export interface CheckoutPayload {
    shiftId?: number;
    items: CartItem[];
    subTotal: number | string;
    taxAmount?: number | string;
    serviceChargeAmount?: number | string;
    totalAmount: number | string;
    paymentMethod?: 'CASH' | 'CARD' | 'QRIS' | string;
}

export interface CheckoutResult {
    success: boolean;
    message: string;
}

// ── Service functions ──────────────────────────────────────────────────────────

export const salesService = {
    /** POST /api/sales — complete a POS checkout transaction */
    checkout: (data: CheckoutPayload) =>
        apiFetch<CheckoutResult>('/sales', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
