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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aplikasi-stok-kerabat.onrender.com/api';

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

// Named re-exports for convenience
export const { signIn, signOut, useSession, getSession } = authClient;
