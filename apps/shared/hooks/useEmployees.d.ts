import { type CreateUserPayload, type UpdateUserPayload, type User } from '../services/userService';
export type { User };
export declare const userKeys: {
    all: readonly ["users"];
    list: () => readonly ["users", "list"];
};
export declare const useEmployees: () => import("@tanstack/react-query").UseQueryResult<User[], Error>;
export declare const useCreateEmployee: () => import("@tanstack/react-query").UseMutationResult<User, Error, CreateUserPayload, unknown>;
export declare const useUpdateEmployee: () => import("@tanstack/react-query").UseMutationResult<User, Error, {
    id: string;
    data: UpdateUserPayload;
}, unknown>;
export declare const useDeleteEmployee: () => import("@tanstack/react-query").UseMutationResult<{
    message: string;
    user: User;
}, Error, string, unknown>;
