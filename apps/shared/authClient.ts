/**
 * apps/shared/authClient.ts
 * Better Auth React client singleton for the Kerabat POS monorepo.
 *
 * Provides:
 *   - `authClient.signIn.email({ email, password })` — login
 *   - `authClient.signOut()` — logout
 *   - `authClient.useSession()` — reactive session hook (React hook)
 *   - `authClient.getSession()` — imperative session fetch
 */

import { createAuthClient } from 'better-auth/react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, API_BASE_URL } from './apiClient';

// Strip trailing /api if present so Better Auth can construct /api/auth paths
const AUTH_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: {
        credentials: 'include',
        // Optional: Include token in Better Auth's own requests if cookie fails
        async onRequest(context: any) {
            const token = typeof window !== 'undefined' ? localStorage.getItem('kerabat_auth_token') : null;
            if (token && context.request) {
                context.request.headers.set('Authorization', `Bearer ${token}`);
            }
        }
    }
});

// Custom getSession that uses our manual backend endpoint (which checks Bearer token)
export const getSession = async () => {
    try {
        const data = await apiFetch<any>('/auth/session');
        if (!data) return { data: null, error: 'No session' };
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: e };
    }
};

// Custom useSession hook using React Query to replace better-auth's useSession
export function useSession() {
    const { data, isPending, refetch, error } = useQuery({
        queryKey: ['auth_session'],
        queryFn: async () => {
            const res = await getSession();
            return res.data;
        },
        retry: 0,
        staleTime: 5 * 60 * 1000 // 5 minutes
    });

    return {
        data,
        isPending,
        refetch,
        error
    };
}

export const { signIn, signOut } = authClient;
