import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export function useAttendance(filters: any = {}) {
    const queryClient = useQueryClient();

    const todayQuery = useQuery({
        queryKey: ['attendance', 'today'],
        queryFn: () => apiClient.getTodayAttendance(),
        retry: 1,
    });

    const historyQuery = useQuery({
        queryKey: ['attendance', 'history', filters],
        queryFn: () => apiClient.getAttendanceHistory(filters),
        enabled: !!filters,
    });

    const checkInMutation = useMutation({
        mutationFn: () => apiClient.checkIn(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: () => apiClient.checkOut(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    return {
        todayAttendance: todayQuery.data || null,
        history: historyQuery.data ?? [],
        isLoading: todayQuery.isLoading || historyQuery.isLoading,
        isActionLoading: checkInMutation.isPending || checkOutMutation.isPending,
        error: todayQuery.error || historyQuery.error,
        checkIn: checkInMutation.mutateAsync,
        checkOut: checkOutMutation.mutateAsync,
    };
}
