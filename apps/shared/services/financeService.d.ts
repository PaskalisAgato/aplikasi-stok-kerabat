/**
 * apps/shared/services/financeService.ts
 *
 * Typed service layer for all /api/finance endpoints.
 */
export interface Expense {
    id: number;
    title: string;
    category: string;
    amount: string;
    receiptUrl?: string | null;
    expenseDate: string;
    createdAt?: string;
}
export interface TopMenu {
    recipeId: number;
    name: string;
    totalQty: number;
}
export interface FinanceReport {
    revenue: number;
    revenueToday: number;
    expenses: number;
    netProfit: number;
    topMenus: TopMenu[];
}
export interface IngredientHPP {
    id: number;
    name: string;
    totalCost: number;
    totalQty: number;
}
export interface HPPAnalysis {
    totalHPP: number;
    ingredientsHPP: IngredientHPP[];
}
export interface CreateExpensePayload {
    title: string;
    category: string;
    amount: number | string;
    date?: string;
    receiptUrl?: string;
}
export declare const financeService: {
    /** GET /api/finance/reports — P&L summary for dashboard */
    fetchReports: () => Promise<FinanceReport>;
    /** GET /api/finance/expenses — all expenses ordered by date DESC */
    fetchExpenses: () => Promise<Expense[]>;
    /** POST /api/finance/expenses — record a new expense */
    createExpense: (data: CreateExpensePayload) => Promise<Expense>;
    /** DELETE /api/finance/expenses/:id — remove an expense */
    deleteExpense: (id: number) => Promise<{
        message: string;
    }>;
    /** GET /api/finance/hpp — 30-day HPP/COGS analysis */
    fetchHPP: () => Promise<HPPAnalysis>;
};
