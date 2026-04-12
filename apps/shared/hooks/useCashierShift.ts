import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export function useCashierShift() {
    const queryClient = useQueryClient();

    const activeShiftQuery = useQuery({
        queryKey: ['cashier-shifts', 'active'],
        queryFn: () => apiClient.getActiveCashierShift(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const openShiftMutation = useMutation({
        mutationFn: (initialCash: number) => apiClient.openCashierShift(initialCash),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashier-shifts'] }),
    });

    const closeShiftMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { actualCash: number, actualNonCash: number, notes: string } }) => 
            apiClient.closeCashierShift(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashier-shifts'] }),
    });

    const getSummaryMutation = useMutation({
        mutationFn: (id: number) => apiClient.getCashierShiftSummary(id),
    });

    return {
        activeShift: activeShiftQuery.data?.data ?? null,
        isActiveLoading: activeShiftQuery.isLoading,
        activeError: activeShiftQuery.error,
        openShift: openShiftMutation.mutateAsync,
        closeShift: closeShiftMutation.mutateAsync,
        getSummary: getSummaryMutation.mutateAsync,
        isMutating: openShiftMutation.isPending || closeShiftMutation.isPending || getSummaryMutation.isPending,
        refreshActiveShift: () => queryClient.invalidateQueries({ queryKey: ['cashier-shifts', 'active'] })
    };
}
