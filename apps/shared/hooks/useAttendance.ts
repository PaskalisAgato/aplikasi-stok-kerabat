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
        mutationFn: (photo?: File | Blob) => {
            const formData = new FormData();
            if (photo) formData.append('photo', photo);
            return apiClient.checkIn(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    const checkOutMutation = useMutation({
        mutationFn: (photo?: File | Blob) => {
            const formData = new FormData();
            if (photo) formData.append('photo', photo);
            return apiClient.checkOut(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => apiClient.deleteAttendance(id),
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
        deleteRecord: deleteMutation.mutateAsync,
    };
}
