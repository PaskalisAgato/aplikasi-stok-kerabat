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

// Better Auth React client should use the /api base so it can naturally hit /api/auth
const AUTH_BASE_URL = API_BASE_URL;

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
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
        const data = await apiFetch<any>('/auth/session', { cache: 'no-store' });
        // The backend returns { session: null } if no session is found.
        if (!data || !data.session) return { data: null, error: null };
        return { data: data.session, error: null };
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
            if (res.error) {
                throw res.error instanceof Error ? res.error : new Error(res.error);
            }
            return res.data;
        },
        retry: 0,
        staleTime: 0, // 🔥 WAJIB
        gcTime: 0     // 🔥 biar langsung dibuang dari cache
    });

    return {
        data,
        isPending,
        refetch,
        error
    };
}

export const { signIn, signOut } = authClient;
