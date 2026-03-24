import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, type CreateUserPayload, type UpdateUserPayload, type User } from '../services/userService';
import type { ApiResponse } from '../apiClient';
export type { User };

export const userKeys = {
    all: ['users'] as const,
    list: () => [...userKeys.all, 'list'] as const,
};

export const useEmployees = () =>
    useQuery<ApiResponse<User>, Error, User[]>({
        queryKey: userKeys.list(),
        select: (res) => res.data ?? [],
        queryFn: userService.fetchAll,
    });

export const useCreateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserPayload) => userService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
    });
};

export const useUpdateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
            userService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
    });
};

export const useDeleteEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.list() }),
    });
};
