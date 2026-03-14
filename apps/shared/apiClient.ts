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
    public status: number;
    public statusText: string;

    constructor(
        status: number,
        statusText: string,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
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
    getInventory: () => apiFetch<any[]>('/inventory'),
    getItemMovements: (id: number) => apiFetch<any[]>(`/inventory/${id}/movements`),
    addInventoryItem: (data: unknown) => apiFetch<any>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    updateInventoryItem: (id: number, data: unknown) => apiFetch<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    submitOpname: (adjustments: unknown[]) => apiFetch<any>('/inventory/opname', { method: 'POST', body: JSON.stringify({ adjustments }) }),
    recordStockMovement: (inventoryId: number, data: unknown) => apiFetch<any>(`/inventory/${inventoryId}/movement`, { method: 'POST', body: JSON.stringify(data) }),
    getWasteSummary: () => apiFetch<any>('/inventory/waste/summary'),
    getStockInHistory: () => apiFetch<any[]>('/inventory/movements/in'),
    getItemWaste: (id: number) => apiFetch<any[]>(`/inventory/${id}/waste`),

    // ---- RECIPES ----
    getRecipes: () => apiFetch<any[]>('/recipes'),
    createRecipe: (data: unknown) => apiFetch<any>('/recipes', { method: 'POST', body: JSON.stringify(data) }),
    updateRecipe: (id: number, data: unknown) => apiFetch<any>(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecipe: (id: number) => apiFetch<any>(`/recipes/${id}`, { method: 'DELETE' }),

    // ---- SALES ----
    checkoutCart: (checkoutData: unknown) => apiFetch<any>('/sales', { method: 'POST', body: JSON.stringify(checkoutData) }),

    // ---- FINANCE ----
    getFinanceReports: () => apiFetch<any>('/finance/reports'),
    getExpenses: () => apiFetch<any[]>('/finance/expenses'),
    addExpense: (data: unknown) => apiFetch<any>('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
    updateExpense: (id: number, data: unknown) => apiFetch<any>(`/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteExpense: (id: number) => apiFetch<any>(`/finance/expenses/${id}`, { method: 'DELETE' }),
    getExpenseCategories: () => apiFetch<any[]>('/finance/expenses/categories'),
    addExpenseCategory: (data: unknown) => apiFetch<any>('/finance/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),
    deleteExpenseCategory: (id: number) => apiFetch<any>(`/finance/expenses/categories/${id}`, { method: 'DELETE' }),
    getHPPAnalysis: () => apiFetch<any>('/finance/hpp'),
};
