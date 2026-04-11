/**
 * apps/shared/apiClient.ts
 *
 * Base HTTP utility for the Kerabat POS monorepo. (v1.0.2 - final sync)
 */
export declare const API_BASE_URL: any;
export declare class ApiError extends Error {
    status: number;
    statusText: string;
    constructor(status: number, statusText: string, message: string);
}
/**
 * Tries to parse JSON and returns a fallback if it fails.
 * Prevents "unterminated string" or "unexpected token" errors from crashing the app.
 */
export declare function safeJsonParse<T>(text: string, fallback: T): T;
export interface ApiMeta {
    total: number;
    limit: number;
    page: number;
}
export interface ApiResponse<T> {
    data: T[];
    meta: ApiMeta;
}
/**
 * `apiFetch` wraps native fetch with:
 *  - Automatic base URL prefixing
 *  - `credentials: 'include'` so Better Auth session cookies are forwarded
 *  - JSON body serialisation
 *  - Typed `ApiError` on non-2xx responses
 *  - 15s timeout + 1 automatic retry on network errors
 */
export declare function apiFetch<T = unknown>(path: string, init?: RequestInit, asBlob?: boolean, retries?: number): Promise<T>;
export declare const apiClient: {
    getInventory: (limit?: number, offset?: number, search?: string, status?: string, category?: string, ids?: string, signal?: AbortSignal) => Promise<ApiResponse<any>>;
    getInventoryItem: (id: number) => Promise<any>;
    getInventoryPriceLogs: (id: number) => Promise<ApiResponse<any>>;
    exportInventoryExcel: () => Promise<Blob>;
    addInventoryItem: (data: {
        name: string;
        category: string;
        unit: string;
        minStock: string;
        idealStock?: string;
        pricePerUnit?: string;
        discountPrice?: string;
        containerWeight?: string;
        containerId?: number;
        currentStock?: string | number;
        physicalStock?: string | number;
        imageUrl?: string;
    }) => Promise<ApiResponse<any>>;
    updateInventoryItem: (id: number, data: {
        name?: string;
        category?: string;
        unit?: string;
        minStock?: string;
        idealStock?: string;
        pricePerUnit?: string;
        discountPrice?: string;
        containerWeight?: string;
        containerId?: number;
        currentStock?: string | number;
        physicalStock?: string | number;
        imageUrl?: string;
        version?: string;
    }) => Promise<ApiResponse<any>>;
    submitOpname: (adjustments: unknown[]) => Promise<any>;
    recordStockMovement: (inventoryId: number, data: unknown) => Promise<any>;
    getWasteSummary: () => Promise<any>;
    getStockInHistory: () => Promise<ApiResponse<any>>;
    getItemWaste: (id: number) => Promise<ApiResponse<any>>;
    deleteInventoryItem: (id: number) => Promise<any>;
    getContainers: () => Promise<ApiResponse<any>>;
    getContainer: (id: number) => Promise<ApiResponse<any>>;
    createContainer: (data: {
        name: string;
        tareWeight: number | string;
        qrCode?: string;
    }) => Promise<ApiResponse<any>>;
    updateContainer: (id: number, data: {
        name?: string;
        tareWeight?: number | string;
        isLocked?: boolean;
        qrCode?: string;
    }) => Promise<ApiResponse<any>>;
    deleteContainer: (id: number) => Promise<ApiResponse<any>>;
    getRecipes: () => Promise<ApiResponse<any>>;
    getProducts: () => Promise<ApiResponse<any>>;
    createRecipe: (data: unknown) => Promise<any>;
    updateRecipe: (id: number, data: unknown) => Promise<any>;
    deleteRecipe: (id: number) => Promise<any>;
    getTransactions: (limit?: number, offset?: number) => Promise<ApiResponse<any>>;
    getTransactionById: (id: number) => Promise<any>;
    checkoutCart: (checkoutData: unknown) => Promise<any>;
    updateTransaction: (id: number, data: unknown) => Promise<any>;
    clearTransactions: () => Promise<any>;
    deleteTransaction: (id: number) => Promise<any>;
    getFinanceReports: () => Promise<any>;
    getExpenses: (limit?: number, offset?: number) => Promise<ApiResponse<any>>;
    getExpenseById: (id: number) => Promise<any>;
    exportExpensesExcel: () => Promise<Blob>;
    addExpense: (data: unknown) => Promise<any>;
    updateExpense: (id: number, data: unknown) => Promise<any>;
    deleteExpense: (id: number) => Promise<any>;
    getExpenseCategories: () => Promise<ApiResponse<any>>;
    addExpenseCategory: (data: unknown) => Promise<any>;
    deleteExpenseCategory: (id: number) => Promise<any>;
    getHPPAnalysis: () => Promise<ApiResponse<any>>;
    getExpensePhoto: (id: number) => Promise<any>;
    getRecipePhoto: (id: number) => Promise<any>;
    getAllShifts: () => Promise<ApiResponse<any>>;
    getMyShifts: () => Promise<ApiResponse<any>>;
    createShift: (data: unknown) => Promise<any>;
    updateShift: (id: number, data: unknown) => Promise<any>;
    deleteShift: (id: number) => Promise<any>;
    exportShiftTemplate: () => Promise<Blob>;
    exportSchedule: (data: any) => Promise<Blob>;
    getTodayAttendance: () => Promise<any>;
    checkIn: (data?: any) => Promise<any>;
    checkOut: (data?: any) => Promise<any>;
    getAttendanceHistory: (params: Record<string, string>) => Promise<ApiResponse<any>>;
    deleteAttendanceByRange: (startDate: string, endDate: string) => Promise<any>;
    deleteAttendance: (id: string | number) => Promise<any>;
    getTodos: () => Promise<ApiResponse<any>>;
    createTodo: (data: unknown) => Promise<any>;
    updateTodo: (id: number, data: unknown) => Promise<any>;
    deleteTodo: (id: number) => Promise<any>;
    completeTodo: (id: number, photoProof: string | string[]) => Promise<any>;
    getTodoHistory: (page?: number, limit?: number) => Promise<ApiResponse<any>>;
    clearTodoHistory: () => Promise<any>;
    getTodoPhoto: (id: number, type?: "todo" | "completion") => Promise<any>;
    getTodoSettings: () => Promise<any>;
    updateTodoSetting: (key: string, value: string) => Promise<any>;
    getSystemStats: () => Promise<any>;
    getBackups: () => Promise<ApiResponse<any>>;
    triggerBackup: () => Promise<any>;
};
