import { type ApiResponse } from '../apiClient';
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    pin: string;
    image?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreateUserPayload {
    name: string;
    email: string;
    role: string;
    pin: string;
}
export interface UpdateUserPayload {
    name?: string;
    email?: string;
    role?: string;
    pin?: string;
}
export declare const userService: {
    fetchAll: () => Promise<ApiResponse<User>>;
    create: (data: CreateUserPayload) => Promise<User>;
    update: (id: string, data: UpdateUserPayload) => Promise<User>;
    delete: (id: string) => Promise<{
        message: string;
        user: User;
    }>;
};
