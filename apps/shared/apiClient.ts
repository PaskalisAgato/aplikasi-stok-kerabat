/**
 * apps/shared/apiClient.ts
 *
 * Base HTTP utility for the Kerabat POS monorepo.
 */

// Deployment URL (Dynamic via environment variables)
const rawUrl = (typeof process !== 'undefined' && process.env?.VITE_API_URL) 
    || (import.meta as any).env?.VITE_API_URL 
    || 'https://aplikasi-stok-kerabat.onrender.com/api';

// Pastikan URL diakhiri dengan /api
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

// ── Keep-alive ping (mencegah Render Free Plan tidur) ──────────────────────────
// Ping server setiap 10 menit agar tidak sleep (membantu meskipun tidak 100%)
if (typeof window !== 'undefined') {
    const pingServer = () => {
        fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, { credentials: 'include' }).catch(() => {
            // Silent – hanya untuk menjaga server tetap aktif
        });
    };
    // Ping pertama setelah 5 menit, lalu setiap 10 menit
    setTimeout(() => {
        pingServer();
        setInterval(pingServer, 10 * 60 * 1000);
    }, 5 * 60 * 1000);
}

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
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 1;

/**
 * `apiFetch` wraps native fetch with:
 *  - Automatic base URL prefixing
 *  - `credentials: 'include'` so Better Auth session cookies are forwarded
 *  - JSON body serialisation
 *  - Typed `ApiError` on non-2xx responses
 *  - 15s timeout + 1 automatic retry on network errors
 */
export async function apiFetch<T = unknown>(
    path: string,
    init: RequestInit = {},
    retries = MAX_RETRIES
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const token = typeof window !== 'undefined' ? localStorage.getItem('kerabat_auth_token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...init,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

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

        if (response.status === 204) return undefined as T;
        return response.json() as Promise<T>;

    } catch (err: any) {
        clearTimeout(timeoutId);

        const isNetworkError = !(err instanceof ApiError);
        if (isNetworkError && retries > 0) {
            console.warn(`[apiFetch] Koneksi gagal ke ${path}, mencoba ulang...`);
            await new Promise(r => setTimeout(r, 2000));
            return apiFetch<T>(path, init, retries - 1);
        }

        if (err.name === 'AbortError') {
            throw new ApiError(0, 'Timeout', `Koneksi ke server terlalu lama (${FETCH_TIMEOUT_MS / 1000}s).`);
        }

        throw err;
    }
}

// ── Legacy compat layer (Updated for Modular Architecture) ────────────────────────
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

    // ---- PRODUCTS (Mappings to old names for frontend compatibility) ----
    getRecipes: () => apiFetch<any[]>('/products'),
    getProducts: () => apiFetch<any[]>('/products'),
    createRecipe: (data: unknown) => apiFetch<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateRecipe: (id: number, data: unknown) => apiFetch<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecipe: (id: number) => apiFetch<any>(`/products/${id}`, { method: 'DELETE' }),

    // ---- TRANSACTIONS ----
    checkoutCart: (checkoutData: unknown) => apiFetch<any>('/transactions', { method: 'POST', body: JSON.stringify(checkoutData) }),

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

