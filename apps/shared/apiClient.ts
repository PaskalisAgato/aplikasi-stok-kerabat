/**
 * apps/shared/apiClient.ts
 *
 * Base HTTP utility for the Kerabat POS monorepo. (v1.0.2 - final sync)
 */

// Deployment URL (Dynamic via environment variables)
let rawUrl = (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process.env?.VITE_API_URL) 
    || (import.meta as any).env?.VITE_API_URL 
    || 'https://api.kerabatkopitiam.my.id/api';

// HARD OVERRIDE: Paksa ke VPS baru jika masih menunjuk ke server lama
if (rawUrl.includes('onrender.com') || rawUrl.includes('project-k7dex.vercel.app')) {
    console.warn('[Config] Mendeteksi URL server lama. Dialihkan ke backend VPS baru.');
    rawUrl = 'https://api.kerabatkopitiam.my.id/api';
}

// Pastikan URL diakhiri dengan /api
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;

// ── FORCE CLEAR STUCK SERVICE WORKERS ──────────────────────────────────────
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for(let registration of registrations) {
            registration.unregister().then(bool => {
                if (bool) console.log('Successfully unregistered old ServiceWorker');
            });
        }
    });
}

// ── Keep-alive ping sudah tidak diperlukan ──────────────────────────────────────
// Backend sekarang berjalan di VPS (server selalu aktif, tidak tidur seperti Render Free Plan)

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

// ── Shared Types (Phase 5: Build Fix) ──────────────────────────────────────────
export interface ApiMeta {
    total: number;
    limit: number;
    page: number;
    hasMore?: boolean;
}

export interface ApiResponse<T> {
    data: T[];
    meta: ApiMeta;
    summary?: any;
    success?: boolean;
    message?: string;
}

// ── Resilience Config ────────────────────────────────────────────────────────
const FETCH_TIMEOUT_MS = 10_000; // Fail-fast: 10s timeout for better UX on poor connections
const MAX_RETRIES = 1;         // 1 retry as per Enterprise Section 4
const CACHE_TTL_MS = 30_000;   // 30 seconds as per Enterprise Section 6

// Simple In-Memory Cache for GET requests
const getCache = new Map<string, { data: any; timestamp: number }>();

// ── Circuit Breaker State (Phase 3) ──────────────────────────────────────────
let failureWindow: boolean[] = []; // true = success, false = fail
let circuitTrippedUntil = 0;
const BREAKER_WINDOW = 30;    // Increased window for better sample size
const BREAKER_THRESHOLD = 27; // Relaxed: 90% failures needed to trip (during migration)
const COOLDOWN_MS = 10_000;   // Reduced cooldown to 10s for faster recovery

function updateBreaker(success: boolean) {
    failureWindow.push(success);
    if (failureWindow.length > BREAKER_WINDOW) failureWindow.shift();
    
    if (failureWindow.length >= BREAKER_WINDOW) {
        const failCount = failureWindow.filter(s => !s).length;
        if (failCount >= BREAKER_THRESHOLD) {
            console.error(`[Circuit Breaker] Tripped! Cooldown for ${COOLDOWN_MS/1000}s`);
            circuitTrippedUntil = Date.now() + COOLDOWN_MS;
        }
    }
}
 
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
    const method = init.method || 'GET';

    // 0. Circuit Breaker Check (Phase 3)
    if (Date.now() < circuitTrippedUntil) {
        // Fallback for GET: Try cache if offline
        if (method === 'GET' && getCache.has(url)) {
            console.warn(`[Failover] Circuit tripped. Serving cached data for ${path}`);
            return getCache.get(url)!.data as T;
        }
        throw new ApiError(503, 'Service Busy', 'Sistem sedang sibuk karena beban tinggi (Circuit Breaker aktif). Silakan coba lagi dalam 30 detik.');
    }

    // 1. Caching (Section 6)
    if (method === 'GET' && !asBlob) {
        const cached = getCache.get(url);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
            return cached.data as T;
        }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('kerabat_auth_token') : null;

    const headers: HeadersInit = {
        ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'X-Idempotency-Key': (init as any).idempotencyKey || `req_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
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
        updateBreaker(true);

        // 2. Cache Invalidation (Phase 3)
        if (method !== 'GET' && response.ok) {
            console.log(`[Cache] Mutation detected on ${path}. Invalidating all GET caches.`);
            getCache.clear(); 
        }

        if (!response.ok) {
            const errorText = await response.text();
            let message = response.statusText;
            const errorBody = safeJsonParse<any>(errorText, null);
            if (errorBody) message = errorBody.message ?? errorBody.error ?? message;
            throw new ApiError(response.status, response.statusText, message);
        }

        if (asBlob) return (await response.blob()) as unknown as T;
        const responseText = response.status === 204 ? '' : await response.text();

        if (response.status === 204) return undefined as T;
        
        const rawData = safeJsonParse<any>(responseText, [] as unknown as T);
        let finalData = rawData;
        
        if (Array.isArray(rawData)) {
            finalData = { data: rawData, meta: { total: rawData.length, limit: rawData.length, page: 1 } };
        } else if (rawData && typeof rawData === 'object' && 'success' in rawData) {
            if (rawData.success === true) {
                // Preserve the success flag and any message/original data
                const normalized = {
                    success: true,
                    message: rawData.message,
                    data: rawData.data,
                    // If rawData itself already has meta, use it, otherwise create fallback
                    meta: rawData.meta || { total: Array.isArray(rawData.data) ? rawData.data.length : 1, limit: 100, page: 1 },
                    ...(rawData.summary ? { summary: rawData.summary } : {})
                };
                finalData = normalized;
            } else {
                throw new ApiError(response.status, response.statusText, rawData.message || 'Operation failed');
            }
        }

        if (method === 'GET' && !asBlob) {
            getCache.set(url, { data: finalData, timestamp: Date.now() });
        }

        return finalData as T;

    } catch (err: any) {
        clearTimeout(timeoutId);

        // 3. Failover / Read-Only Mode (Phase 3)
        const isNetworkError = !(err instanceof ApiError) || err.status >= 500;
        
        if (isNetworkError) {
            updateBreaker(false); 
            // Fallback to cache on network failure
            if (method === 'GET' && getCache.has(url)) {
                console.warn(`[Failover] Backend unreachable. Serving STALE cached data for ${path}`);
                return getCache.get(url)!.data as T;
            }
        }

        if (err.name === 'AbortError') {
            if (retries > 0) return apiFetch<T>(path, init, asBlob, retries - 1);
            throw new ApiError(408, 'Request Timeout', `Koneksi lambat (${FETCH_TIMEOUT_MS/1000}s). Periksa internet Anda.`);
        }

        if (!(err instanceof ApiError) && retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return apiFetch<T>(path, init, asBlob, retries - 1);
        }

        throw err;
    }
}

// ── Legacy compat layer (Updated for Modular Architecture) ────────────────────────
export const apiClient = {
    // ---- INVENTORY ----
    getInventory: (limit = 20, offset = 0, search = '', status = '', category = '', ids = '', signal?: AbortSignal) => {
        let url = `/inventory?limit=${limit}&offset=${offset}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (ids) url += `&ids=${encodeURIComponent(ids)}`;
        return apiFetch<ApiResponse<any>>(url, { signal });
    },
    getInventoryItem: (id: number) => apiFetch<any>(`/inventory/${id}`),
    getInventoryPriceLogs: (id: number) => apiFetch<ApiResponse<any>>(`/inventory/${id}/price-logs`),
    exportInventoryExcel: () => apiFetch<Blob>('/inventory/export', { method: 'GET' }, true),
    addInventoryItem: (data: { name: string, category: string, unit: string, minStock: string, idealStock?: string, pricePerUnit?: string, discountPrice?: string, containerWeight?: string, containerId?: number, currentStock?: string|number, physicalStock?: string|number, imageUrl?: string }) => 
        apiFetch<ApiResponse<any>>('/inventory', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    updateInventoryItem: (id: number, data: { name?: string, category?: string, unit?: string, minStock?: string, idealStock?: string, pricePerUnit?: string, discountPrice?: string, containerWeight?: string, containerId?: number, currentStock?: string|number, physicalStock?: string|number, imageUrl?: string, version?: string }) => 
        apiFetch<ApiResponse<any>>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    submitOpname: (adjustments: Array<{ inventoryId: number, physicalStock: string | number, reason: string, containerWeight?: string | number }>) => apiFetch<any>('/inventory/opname', { method: 'POST', body: JSON.stringify({ adjustments }) }),
    recordStockMovement: (inventoryId: number, data: unknown) => apiFetch<any>(`/inventory/${inventoryId}/movement`, { method: 'POST', body: JSON.stringify(data) }),
    getItemMovements: (inventoryId: number) => apiFetch<ApiResponse<any>>(`/inventory/${inventoryId}/movements`),
    getWasteSummary: async (params?: any) => {
        try {
            let url = '/finance/waste-analysis';
            if (params) {
                const query = new URLSearchParams(params).toString();
                url += `?${query}`;
            }
            return await apiFetch<any>(url);
        } catch (err) {
            console.error('[apiClient] getWasteSummary Error:', err);
            return { success: false, data: null };
        }
    },
    getStockInHistory: () => apiFetch<ApiResponse<any>>('/inventory/movements/in'),
    getItemWaste: (id: number) => apiFetch<ApiResponse<any>>(`/inventory/${id}/waste`),
    deleteInventoryItem: (id: number) => apiFetch<any>(`/inventory/${id}`, { method: 'DELETE' }),

    // Containers API
    getContainers: () => apiFetch<ApiResponse<any>>('/containers'),
    getContainer: (id: number) => apiFetch<ApiResponse<any>>(`/containers/${id}`),
    createContainer: (data: { name: string, tareWeight: number|string, qrCode?: string }) => 
        apiFetch<ApiResponse<any>>('/containers', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    updateContainer: (id: number, data: { name?: string, tareWeight?: number|string, isLocked?: boolean, qrCode?: string }) => 
        apiFetch<ApiResponse<any>>(`/containers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    deleteContainer: (id: number) => apiFetch<ApiResponse<any>>(`/containers/${id}`, {
        method: 'DELETE'
    }),

    // ---- PRODUCTS (Mappings to old names for frontend compatibility) ----
    getRecipes: () => apiFetch<ApiResponse<any>>('/products'),
    getProducts: () => apiFetch<ApiResponse<any>>('/products'),
    createRecipe: (data: unknown) => apiFetch<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateRecipe: (id: number, data: unknown) => apiFetch<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRecipe: (id: number) => apiFetch<any>(`/products/${id}`, { method: 'DELETE' }),

    // ---- TRANSACTIONS ----
    getTransactions: (limit = 100, offset = 0, startDate?: string, endDate?: string) => {
        let url = `/transactions?limit=${limit}&offset=${offset}`;
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        return apiFetch<ApiResponse<any>>(url);
    },
    exportTransactionsExcel: (startDate?: string, endDate?: string) => {
        let url = `/transactions/export?`;
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        return apiFetch<Blob>(url, { method: 'GET' }, true);
    },
    getTransactionById: (id: number) => apiFetch<any>(`/transactions/${id}`),
    checkoutCart: (checkoutData: unknown) => apiFetch<any>('/transactions', { method: 'POST', body: JSON.stringify(checkoutData) }),
    getOpenBills: () => apiFetch<ApiResponse<any>>('/transactions/open-bills'),
    addItemsToBill: (id: number | string, items: any[]) => apiFetch<any>(`/transactions/${id}/add-items`, { method: 'POST', body: JSON.stringify({ items }) }),
    mergeBills: (sourceIds: number | string | (number | string)[], targetId: number | string) => {
        const payload = Array.isArray(sourceIds) ? { sourceIds, targetId } : { sourceId: sourceIds, targetId };
        return apiFetch<any>('/transactions/merge', { method: 'POST', body: JSON.stringify(payload) });
    },
    splitBill: (data: { sourceId: number | string, targetInfo?: string, items: { saleItemId: number, quantity: number }[] }) => apiFetch<any>('/transactions/split', { method: 'POST', body: JSON.stringify(data) }),
    updateTransaction: (id: number, data: unknown) => apiFetch<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    clearTransactions: () => apiFetch<any>('/transactions/clear', { method: 'DELETE' }),
    deleteTransaction: (id: number) => apiFetch<any>(`/transactions/${id}`, { method: 'DELETE' }),
    voidTransaction: (id: number, reason: string) => apiFetch<any>(`/transactions/${id}/void`, { method: 'POST', body: JSON.stringify({ reason }) }),

    // ---- FINANCE ----
    getFinanceReports: () => apiFetch<any>('/finance/reports'),
    getExpenses: (limit = 20, offset = 0, startDate?: string, endDate?: string) => {
        let url = `/finance/expenses?limit=${limit}&offset=${offset}`;
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        return apiFetch<ApiResponse<any>>(url);
    },
    getExpenseById: (id: number) => apiFetch<any>(`/finance/expenses/${id}`),
    exportExpensesExcel: (startDate?: string, endDate?: string) => {
        let url = '/finance/expenses/export?';
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
        return apiFetch<Blob>(url, { method: 'GET' }, true);
    },
    addExpense: (data: unknown) => apiFetch<any>('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
    updateExpense: (id: number, data: unknown) => apiFetch<any>(`/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteExpense: (id: number) => apiFetch<any>(`/finance/expenses/${id}`, { method: 'DELETE' }),
    getExpenseCategories: () => apiFetch<ApiResponse<any>>('/finance/expenses/categories'),
    addExpenseCategory: (data: unknown) => apiFetch<any>('/finance/expenses/categories', { method: 'POST', body: JSON.stringify(data) }),
    deleteExpenseCategory: (id: number) => apiFetch<any>(`/finance/expenses/categories/${id}`, { method: 'DELETE' }),
    getHPPAnalysis: () => apiFetch<ApiResponse<any>>('/finance/hpp'),
    getCOGSAnalysis: () => apiFetch<ApiResponse<any>>('/finance/cogs'),
    getExpensePhoto: (id: number) => apiFetch<any>(`/finance/expenses/${id}/photo`),
    getRecipePhoto: (id: number) => apiFetch<any>(`/products/${id}/photo`),

    // Owner Income (Uang Masuk)
    getOwnerIncome: (params?: { startDate?: string; endDate?: string }) => {
        let url = '/finance/owner-income';
        if (params) {
            const query = new URLSearchParams(params as any).toString();
            if (query) url += `?${query}`;
        }
        return apiFetch<any>(url);
    },
    addOwnerIncome: (data: { title: string; amount: number | string; source?: string; incomeDate?: string; notes?: string }) =>
        apiFetch<any>('/finance/owner-income', { method: 'POST', body: JSON.stringify(data) }),
    deleteOwnerIncome: (id: number) =>
        apiFetch<any>(`/finance/owner-income/${id}`, { method: 'DELETE' }),


    // ---- SHIFTS ----
    getAllShifts: () => apiFetch<ApiResponse<any>>('/shifts'),
    getMyShifts: () => apiFetch<ApiResponse<any>>('/shifts/my'),
    createShift: (data: unknown) => apiFetch<any>('/shifts', { method: 'POST', body: JSON.stringify(data) }),
    updateShift: (id: number, data: unknown) => apiFetch<any>(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteShift: (id: number) => apiFetch<any>(`/shifts/${id}`, { method: 'DELETE' }),
    exportShiftTemplate: () => apiFetch<Blob>('/shifts/export-template', { method: 'GET' }, true),
    exportSchedule: (data: any) => apiFetch<Blob>('/shifts/export', { method: 'POST', body: JSON.stringify(data) }, true),

    // ---- CASHIER SHIFTS ----
    getActiveCashierShift: () => apiFetch<any>('/cashier-shifts/active'),
    openCashierShift: (initialCash: number) => apiFetch<any>('/cashier-shifts/open', { method: 'POST', body: JSON.stringify({ initialCash }) }),
    getCashierShiftSummary: (id: number) => apiFetch<any>(`/cashier-shifts/summary/${id}`),
    closeCashierShift: (id: number, data: { 
        denominations: Array<{ nominal: number, qty: number }>, 
        actualNonCash: number, 
        notes: string,
        nonCashVerified: boolean
    }) => 
        apiFetch<any>(`/cashier-shifts/close/${id}`, { method: 'POST', body: JSON.stringify(data) }),
    handoverCashierShift: (data: { currentShiftId: number; cashAmount: number; nextCashierName: string; adminPin: string }) =>
        apiFetch<any>('/cashier-shifts/handover', { method: 'POST', body: JSON.stringify(data) }),
    deleteCashierShift: (id: number) => apiFetch<any>(`/cashier-shifts/${id}`, { method: 'DELETE' }),

    // ---- ATTENDANCE ----
    getTodayAttendance: () => apiFetch<any>('/attendance/today'),
    checkIn: (data?: any) => apiFetch<any>('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (data?: any) => apiFetch<any>('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) }),
    getAttendanceHistory: (params: Record<string, string>) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch<ApiResponse<any>>(`/attendance/history?${query}`);
    },
    deleteAttendanceByRange: (startDate: string, endDate: string) => apiFetch<any>('/attendance/bulk-delete', { method: 'DELETE', body: JSON.stringify({ startDate, endDate }) }),
    deleteAttendance: (id: string | number) => apiFetch<any>(`/attendance/${id}`, { method: 'DELETE' }),


    // ---- TODO LIST ----
    getTodos: () => apiFetch<ApiResponse<any>>('/todo'),
    createTodo: (data: unknown) => apiFetch<any>('/todo', { method: 'POST', body: JSON.stringify(data) }),
    updateTodo: (id: number, data: unknown) => apiFetch<any>(`/todo/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTodo: (id: number) => apiFetch<any>(`/todo/${id}`, { method: 'DELETE' }),
    completeTodo: (id: number, photoProof: string | string[]) => apiFetch<any>(`/todo/${id}/complete`, { method: 'POST', body: JSON.stringify({ photoProof }) }),
    getTodoHistory: (page = 1, limit = 20) => apiFetch<ApiResponse<any>>(`/todo/history?page=${page}&limit=${limit}`),
    clearTodoHistory: () => apiFetch<any>('/todo/history/clear', { method: 'DELETE' }),
    getTodoPhoto: (id: number, type: 'todo' | 'completion' = 'todo') => apiFetch<any>(`/todo/${id}/photo?type=${type}`),
    getTodoSettings: () => apiFetch<any>('/todo/settings'),
    updateTodoSetting: (key: string, value: string) => apiFetch<any>('/todo/settings', { method: 'PUT', body: JSON.stringify({ key, value }) }),

    // ---- SYSTEM ADMIN & OBSERVABILITY ----
    getSystemStats: () => apiFetch<any>('/system/stats'),
    getBackups: () => apiFetch<ApiResponse<any>>('/system/backups'),
    triggerBackup: () => apiFetch<any>('/system/backups/trigger', { method: 'POST' }),

    // ---- ANALYTICS & OWNER DASHBOARD ----
    getAnalyticsDashboard: (params?: any) => {
        let url = '/analytics/dashboard';
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `?${query}`;
        }
        return apiFetch<any>(url);
    },
    getProfitLossReport: (params?: any) => {
        let url = '/finance/profit-loss';
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `?${query}`;
        }
        return apiFetch<ApiResponse<any>>(url);
    },
    getWasteAnalysis: async (params?: any) => {
        try {
            let url = '/finance/waste-analysis';
            if (params) {
                const query = new URLSearchParams(params).toString();
                url += `?${query}`;
            }
            return await apiFetch<ApiResponse<any>>(url);
        } catch (err) {
            console.error('[apiClient] getWasteAnalysis Error:', err);
            return { success: false, data: null };
        }
    },
    getShiftReports: (params?: any) => {
        let url = '/analytics/reports';
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `?${query}`;
        }
        return apiFetch<any>(url);
    },

    // ---- GENERIC HELPERS ----
    get: (path: string) => apiFetch<any>(path),
    post: (path: string, body: any) => apiFetch<any>(path, { method: 'POST', body: JSON.stringify(body) }),
    postWithIdempotency: (path: string, body: any, idempotencyKey: string) => 
        apiFetch<any>(path, { method: 'POST', body: JSON.stringify(body), idempotencyKey } as any),
    deleteWithIdempotency: (path: string, idempotencyKey: string, body?: any) => 
        apiFetch<any>(path, { method: 'DELETE', idempotencyKey, body: body ? JSON.stringify(body) : undefined } as any),
    put: (path: string, body: any) => apiFetch<any>(path, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (path: string) => apiFetch<any>(path, { method: 'DELETE' }),
};


