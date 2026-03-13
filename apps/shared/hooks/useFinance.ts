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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    financeService,
    type CreateExpensePayload,
} from '../services/financeService';

// ── Query keys ─────────────────────────────────────────────────────────────────
export const financeKeys = {
    all: ['finance'] as const,
    reports: () => [...financeKeys.all, 'reports'] as const,
    expenses: () => [...financeKeys.all, 'expenses'] as const,
    hpp: () => [...financeKeys.all, 'hpp'] as const,
};

// ── Query hooks ────────────────────────────────────────────────────────────────

/** Fetch P&L summary for dashboard (revenue, expenses, netProfit, topMenus) */
export const useFinanceReports = () =>
    useQuery({
        queryKey: financeKeys.reports(),
        queryFn: financeService.fetchReports,
        staleTime: 1000 * 60, // 1 minute
    });

/** Fetch all expenses ordered by date DESC */
export const useExpenses = () =>
    useQuery({
        queryKey: financeKeys.expenses(),
        queryFn: financeService.fetchExpenses,
        staleTime: 1000 * 30,
    });

/** Fetch 30-day HPP/COGS analysis */
export const useHPPAnalysis = () =>
    useQuery({
        queryKey: financeKeys.hpp(),
        queryFn: financeService.fetchHPP,
        staleTime: 1000 * 60 * 5, // 5 minutes — computationally expensive
    });

// ── Mutation hooks ─────────────────────────────────────────────────────────────

/** Record a new expense and invalidate the expense list and reports */
export const useCreateExpense = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExpensePayload) => financeService.createExpense(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: financeKeys.expenses() });
            qc.invalidateQueries({ queryKey: financeKeys.reports() });
        },
    });
};

/** Delete an expense by ID and invalidate caches */
export const useDeleteExpense = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => financeService.deleteExpense(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: financeKeys.expenses() });
            qc.invalidateQueries({ queryKey: financeKeys.reports() });
        },
    });
};
