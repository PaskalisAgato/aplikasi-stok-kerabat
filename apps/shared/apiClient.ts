/**
 * apps/shared/apiClient.ts
 *
 * Base HTTP utility for the Kerabat POS monorepo. (v1.0.2 - final sync)
 */

// Deployment URL (Dynamic via environment variables)
const rawUrl = (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env?.VITE_API_URL) 
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

// ── Safe JSON Parsing Utility ────────────────────────────────────────────────
/**
 * Tries to parse JSON and returns a fallback if it fails.
 * Prevents "unterminated string" or "unexpected token" errors from crashing the app.
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
    if (!text) return fallback;
    try {
        return JSON.parse(text) as T;
    } catch (err) {
        console.error('[apiClient] JSON Parse Failed:', err, 'Raw text:', text.substring(0, 100) + '...');
        return fallback;
    }
}

// ── Base fetch helper ──────────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 60_000;
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
    asBlob = false,
    retries = MAX_RETRIES
): Promise<T> {
    const url = `${API_BASE_URL}${path}`;

    const token = typeof window !== 'undefined' ? localStorage.getItem('kerabat_auth_token') : null;

    const isFormData = init.body instanceof FormData;
    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

        if (asBlob) {
            return (await response.blob()) as unknown as T;
        }

        // Get text first to prevent JSON parse errors on non-json responses (e.g. Render 502/404)
        const responseText = response.status === 204 ? '' : await response.text();

        if (!response.ok) {
            let message = response.statusText;
            const errorBody = safeJsonParse<any>(responseText, null);
            if (errorBody) {
                message = errorBody.error ?? errorBody.message ?? message;
            }
            throw new ApiError(response.status, response.statusText, message);
        }

        if (response.status === 204) return undefined as T;
        
        // Final JSON parse with fallback to empty array to satisfy "data hilang" (user requested this)
        // But we log it clearly in the console.
        return safeJsonParse<T>(responseText, [] as unknown as T);

    } catch (err: any) {
        clearTimeout(timeoutId);


        const isNetworkError = !(err instanceof ApiError);
        if (isNetworkError && retries > 0) {
            console.warn(`[apiFetch] Koneksi gagal ke ${path}, mencoba ulang...`);
            await new Promise(r => setTimeout(r, 2000));
            return apiFetch<T>(path, init, asBlob, retries - 1);
        }

        if (err.name === 'AbortError') {
            throw new ApiError(0, 'Timeout', `Koneksi ke server terlalu lama (60s). Server Render mungkin sedang 'Cold Start'. Harap tunggu.`);
        }

        if (isNetworkError) {
             throw new ApiError(0, 'NetworkError', `Gagal terhubung ke Backend: ${err.message || 'Koneksi Ditolak/ISP Memblokir'}. Pastikan rute https://aplikasi-stok-kerabat.onrender.com/api/health bisa dibuka.`);
        }

        throw err;
    }
}

// ── Legacy compat layer (Updated for Modular Architecture) ────────────────────────
export const apiClient = {
    // ---- INVENTORY ----
    getInventory: (limit = 20, offset = 0) => apiFetch<any[]>(`/inventory?limit=${limit}&offset=${offset}`),
    getInventoryItem: (id: number) => apiFetch<any>(`/inventory/${id}`),
    getInventoryPriceLogs: (id: number) => apiFetch<any[]>(`/inventory/${id}/price-logs`),
    exportInventoryExcel: () => apiFetch<Blob>('/inventory/export', { method: 'GET' }, true),
    getItemMovements: (id: number) => apiFetch<any[]>(`/inventory/${id}/movements`),
    addInventoryItem: (data: unknown) => apiFetch<any>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    updateInventoryItem: (id: number, data: unknown) => apiFetch<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    submitOpname: (adjustments: unknown[]) => apiFetch<any>('/inventory/opname', { method: 'POST', body: JSON.stringify({ adjustments }) }),
    recordStockMovement: (inventoryId: number, data: unknown) => apiFetch<any>(`/inventory/${inventoryId}/movement`, { method: 'POST', body: JSON.stringify(data) }),
    getWasteSummary: () => apiFetch<any>('/inventory/waste/summary'),
    getStockInHistory: () => apiFetch<any[]>('/inventory/movements/in'),
    getItemWaste: (id: number) => apiFetch<any[]>(`/inventory/${id}/waste`),
    deleteInventoryItem: (id: number) => apiFetch<any>(`/inventory/${id}`, { method: 'DELETE' }),

    // ---- PRODUCTS (Mappings to old names for frontend compatibility) ----
    getRecipes: () => apiFetch<any[]>('/products'),
    getProducts: () => apiFetch<any[]>('/products'),
    createRecipe: (data: unknown) => apiFetch<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateRecipe: (id: number, data: unknown) => apiFetch<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecipe: (id: number) => apiFetch<any>(`/products/${id}`, { method: 'DELETE' }),

    // ---- TRANSACTIONS ----
    getTransactions: (limit = 20, offset = 0) => apiFetch<any[]>(`/transactions?limit=${limit}&offset=${offset}`),
    getTransactionById: (id: number) => apiFetch<any>(`/transactions/${id}`),
    checkoutCart: (checkoutData: unknown) => apiFetch<any>('/transactions', { method: 'POST', body: JSON.stringify(checkoutData) }),
    updateTransaction: (id: number, data: unknown) => apiFetch<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTransaction: (id: number) => apiFetch<any>(`/transactions/${id}`, { method: 'DELETE' }),

    // ---- FINANCE ----
    getFinanceReports: () => apiFetch<any>('/finance/reports'),
    getExpenses: (limit = 20, offset = 0) => apiFetch<any[]>(`/finance/expenses?limit=${limit}&offset=${offset}`),
    getExpenseById: (id: number) => apiFetch<any>(`/finance/expenses/${id}`),
    exportExpensesExcel: () => apiFetch<Blob>('/finance/expenses/export', { method: 'GET' }, true),
    addExpense: (data: unknown) => apiFetch<any>('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
    updateExpense: (id: number, data: unknown) => apiFetch<any>(`/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteExpense: (id: number) => apiFetch<any>(`/finance/expenses/${id}`, { method: 'DELETE' }),
    getExpenseCategories: () => apiFetch<any[]>('/finance/expenses/categories'),
    addExpenseCategory: (data: unknown) => apiFetch<any>('/finance/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),
    deleteExpenseCategory: (id: number) => apiFetch<any>(`/finance/expenses/categories/${id}`, { method: 'DELETE' }),
    getHPPAnalysis: () => apiFetch<any>('/finance/hpp'),

    // ---- SHIFTS ----
    getAllShifts: () => apiFetch<any[]>('/shifts'),
    getMyShifts: () => apiFetch<any[]>('/shifts/my'),
    createShift: (data: unknown) => apiFetch<any>('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    updateShift: (id: number, data: unknown) => apiFetch<any>(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteShift: (id: number) => apiFetch<any>(`/shifts/${id}`, { method: 'DELETE' }),
    exportShiftTemplate: () => apiFetch<Blob>('/shifts/export-template', { method: 'GET' }, true),
    exportSchedule: (data: any) => apiFetch<Blob>('/shifts/export', { method: 'POST', body: JSON.stringify(data) }, true),

    // ---- ATTENDANCE ----
    getTodayAttendance: () => apiFetch<any>('/attendance/today'),
    checkIn: (formData?: FormData) => apiFetch<any>('/attendance/check-in', { method: 'POST', body: formData }),
    checkOut: (formData?: FormData) => apiFetch<any>('/attendance/check-out', { method: 'POST', body: formData }),
    getAttendanceHistory: (params: Record<string, string>) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch<any[]>(`/attendance/history?${query}`);
    },
    deleteAttendanceByRange: (startDate: string, endDate: string) => apiFetch<any>('/attendance/bulk-delete', { method: 'DELETE', body: JSON.stringify({ startDate, endDate }) }),
    getAttendancePhoto: (filename: string) => apiFetch<Blob>(`/attendance/view-once/${filename}`, { method: 'GET' }, true),

    // ---- TODO LIST ----
    getTodos: () => apiFetch<any[]>('/todo'),
    createTodo: (data: unknown) => apiFetch<any>('/todo', { method: 'POST', body: JSON.stringify(data) }),
    updateTodo: (id: number, data: unknown) => apiFetch<any>(`/todo/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTodo: (id: number) => apiFetch<any>(`/todo/${id}`, { method: 'DELETE' }),
    completeTodo: (id: number, photoProof: string) => apiFetch<any>(`/todo/${id}/complete`, { method: 'POST', body: JSON.stringify({ photoProof }) }),
    getTodoHistory: () => apiFetch<any[]>('/todo/history'),
    clearTodoHistory: () => apiFetch<any>('/todo/history/clear', { method: 'DELETE' }),

    // ---- SYSTEM ADMIN & OBSERVABILITY ----
    getSystemStats: () => apiFetch<any>('/system/stats'),
    getBackups: () => apiFetch<any[]>('/system/backups'),
    triggerBackup: () => apiFetch<any>('/system/backups/trigger', { method: 'POST' }),
};


