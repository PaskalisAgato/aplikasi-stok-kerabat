/**
 * apps/shared/hooks/useFinance.ts
 *
 * TanStack Query hooks for finance data — reports, expenses, and HPP analysis.
 *
 * Usage:
 *   const { data: report } = useFinanceReports();
 *   const { data: expenses } = useExpenses();
 *   const addExpense = useCreateExpense();
 *   addExpense.mutate({ title: 'Listrik', amount: 500000, category: 'Utilities' });
 */
import { type CreateExpensePayload } from '../services/financeService';
export declare const financeKeys: {
    all: readonly ["finance"];
    reports: () => readonly ["finance", "reports"];
    expenses: () => readonly ["finance", "expenses"];
    hpp: () => readonly ["finance", "hpp"];
};
/** Fetch P&L summary for dashboard (revenue, expenses, netProfit, topMenus) */
export declare const useFinanceReports: () => import("@tanstack/react-query").UseQueryResult<import("../services/financeService").FinanceReport, Error>;
/** Fetch all expenses ordered by date DESC */
export declare const useExpenses: () => import("@tanstack/react-query").UseQueryResult<import("../services/financeService").Expense[], Error>;
/** Fetch 30-day HPP/COGS analysis */
export declare const useHPPAnalysis: () => import("@tanstack/react-query").UseQueryResult<import("../services/financeService").HPPAnalysis, Error>;
/** Record a new expense and invalidate the expense list and reports */
export declare const useCreateExpense: () => import("@tanstack/react-query").UseMutationResult<import("../services/financeService").Expense, Error, CreateExpensePayload, unknown>;
/** Delete an expense by ID and invalidate caches */
export declare const useDeleteExpense: () => import("@tanstack/react-query").UseMutationResult<{
    message: string;
}, Error, number, unknown>;
