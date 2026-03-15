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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Strip trailing /api if present so Better Auth can construct /api/auth paths
const AUTH_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: {
        credentials: 'include'
    }
});

// Named re-exports for convenience
export const { signIn, signOut, useSession, getSession } = authClient;
