/**
 * apps/shared/apiClient.ts
 *
 * Base HTTP utility for the Kerabat POS monorepo.
 *
 * `apiFetch` — typed, credentials-aware base function used by service files.
 * `apiClient` — legacy compat object (still used by older components).
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Typed error class ──────────────────────────────────────────────────────────
export class ApiError extends Error {
    constructor(
        public status: number,
        public statusText: string,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ── Base fetch helper ──────────────────────────────────────────────────────────
/**
 * `apiFetch` wraps native fetch with:
 *  - Automatic base URL prefixing
 *  - `credentials: 'include'` so Better Auth session cookies are forwarded
 *  - JSON body serialisation
 *  - Typed `ApiError` on non-2xx responses
 */
export async function apiFetch<T = unknown>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
    };

    const response = await fetch(url, {
        credentials: 'include',
        ...init,
        headers,
    });

    if (!response.ok) {
        let message = response.statusText;
        try {
            const body = await response.json();
            message = body.error ?? body.message ?? message;
        } catch {
            // ignore JSON parse failures
        }
        throw new ApiError(response.status, response.statusText, message);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

// ── Legacy compat layer ────────────────────────────────────────────────────────
// Kept so existing components that import `apiClient` continue to work
// while being migrated to the new hooks.
export const apiClient = {
    // ---- INVENTORY ----
    getInventory: () => apiFetch('/inventory'),
    getItemMovements: (id: number) => apiFetch(`/inventory/${id}/movements`),
    addInventoryItem: (data: unknown) => apiFetch('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    updateInventoryItem: (id: number, data: unknown) => apiFetch(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    submitOpname: (adjustments: unknown[]) => apiFetch('/inventory/opname', { method: 'POST', body: JSON.stringify({ adjustments }) }),
    recordStockMovement: (inventoryId: number, data: unknown) => apiFetch(`/inventory/${inventoryId}/movement`, { method: 'POST', body: JSON.stringify(data) }),
    getWasteSummary: () => apiFetch('/inventory/waste/summary'),
    getStockInHistory: () => apiFetch('/inventory/movements/in'),
    getItemWaste: (id: number) => apiFetch(`/inventory/${id}/waste`),

    // ---- RECIPES ----
    getRecipes: () => apiFetch('/recipes'),
    createRecipe: (data: unknown) => apiFetch('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    updateRecipe: (id: number, data: unknown) => apiFetch(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecipe: (id: number) => apiFetch(`/recipes/${id}`, { method: 'DELETE' }),

    // ---- SALES ----
    checkoutCart: (checkoutData: unknown) => apiFetch('/sales', { method: 'POST', body: JSON.stringify(checkoutData) }),

    // ---- FINANCE ----
    getFinanceReports: () => apiFetch('/finance/reports'),
    getExpenses: () => apiFetch('/finance/expenses'),
    addExpense: (data: unknown) => apiFetch('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
    deleteExpense: (id: number) => apiFetch(`/finance/expenses/${id}`, { method: 'DELETE' }),
    getHPPAnalysis: () => apiFetch('/finance/hpp'),
};
