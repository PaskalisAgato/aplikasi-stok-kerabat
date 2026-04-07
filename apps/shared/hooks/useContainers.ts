import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export interface Container {
    id: number;
    name: string;
    tareWeight: string;
    isLocked: boolean;
    qrCode?: string;
    createdAt: string;
}

export const useContainers = () => {
    const queryClient = useQueryClient();

    const query = useQuery<Container[]>({
        queryKey: ['containers'],
        queryFn: async () => {
            const response = await apiClient.getContainers();
            return (response.data || []) as Container[];
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string, tareWeight: number|string, qrCode?: string }) => 
            apiClient.createContainer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['containers'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => 
            apiClient.updateContainer(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['containers'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiClient.deleteContainer(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['containers'] });
        }
    });

    return {
        ...query,
        createContainer: createMutation.mutateAsync,
        updateContainer: updateMutation.mutateAsync,
        deleteContainer: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};
