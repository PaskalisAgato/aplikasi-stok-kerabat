import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export function useShifts() {
    const queryClient = useQueryClient();

    const allShiftsQuery = useQuery({
        queryKey: ['shifts', 'all'],
        queryFn: () => apiClient.getAllShifts(),
    });

    const myShiftsQuery = useQuery({
        queryKey: ['shifts', 'my'],
        queryFn: () => apiClient.getMyShifts(),
    });

    const createShiftMutation = useMutation({
        mutationFn: (data: any) => apiClient.createShift(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    });

    const updateShiftMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => apiClient.updateShift(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    });

    const deleteShiftMutation = useMutation({
        mutationFn: (id: number) => apiClient.deleteShift(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
    });

    return {
        allShifts: allShiftsQuery.data?.data ?? [],
        myShifts: myShiftsQuery.data?.data ?? [],
        isLoading: allShiftsQuery.isLoading || myShiftsQuery.isLoading,
        error: allShiftsQuery.error || myShiftsQuery.error,
        createShift: createShiftMutation.mutateAsync,
        updateShift: updateShiftMutation.mutateAsync,
        deleteShift: deleteShiftMutation.mutateAsync,
        isMutating: createShiftMutation.isPending || updateShiftMutation.isPending || deleteShiftMutation.isPending
    };
}
