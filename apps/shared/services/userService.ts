import { apiFetch } from '../apiClient';

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

export const userService = {
    fetchAll: () => apiFetch<User[]>('/users'),
    
    create: (data: CreateUserPayload) => 
        apiFetch<User>('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        
    update: (id: string, data: UpdateUserPayload) => 
        apiFetch<User>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        
    delete: (id: string) => 
        apiFetch<{ message: string; user: User }>(`/users/${id}`, {
            method: 'DELETE'
        })
};
