/**
 * apps/shared/services/financeService.ts
 *
 * Typed service layer for all /api/finance endpoints.
 */

import { apiFetch } from '../apiClient';

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Service functions ──────────────────────────────────────────────────────────

export const financeService = {
    /** GET /api/finance/reports — P&L summary for dashboard */
    fetchReports: () =>
        apiFetch<FinanceReport>('/finance/reports'),

    /** GET /api/finance/expenses — all expenses ordered by date DESC */
    fetchExpenses: () =>
        apiFetch<Expense[]>('/finance/expenses'),

    /** POST /api/finance/expenses — record a new expense */
    createExpense: (data: CreateExpensePayload) =>
        apiFetch<Expense>('/finance/expenses', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /** DELETE /api/finance/expenses/:id — remove an expense */
    deleteExpense: (id: number) =>
        apiFetch<{ message: string }>(`/finance/expenses/${id}`, {
            method: 'DELETE',
        }),

    /** GET /api/finance/hpp — 30-day HPP/COGS analysis */
    fetchHPP: () =>
        apiFetch<HPPAnalysis>('/finance/hpp'),
};
