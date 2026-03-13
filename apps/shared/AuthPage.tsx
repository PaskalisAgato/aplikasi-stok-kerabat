/**
 * apps/shared/AuthPage.tsx
 *
 * Self-contained login page using Better Auth React client.
 * Displayed when `useSession()` returns no active session.
 *
 * Usage in any app's App.tsx:
 *
 *   import { useSession } from '@shared/authClient';
 *   import { AuthPage } from '@shared/AuthPage';
 *
 *   function App() {
 *     const { data: session, isPending } = useSession();
 *     if (isPending) return <Spinner />;
 *     if (!session) return <AuthPage />;
 *     return <MainContent />;
 *   }
 */

import React, { useState } from 'react';
import { signIn } from './authClient';

interface AuthPageProps {
    /** Optional: called after a successful login */
    onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await signIn.email({ email, password });
            if (result.error) {
                setError(result.error.message ?? 'Login gagal. Cek email dan password Anda.');
            } else {
                onSuccess?.();
                // Better Auth updates the session reactively — page will re-render
            }
        } catch (err) {
            setError('Terjadi kesalahan jaringan. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-app font-display flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8">
                {/* Logo / Branding */}
                <div className="text-center space-y-2">
                    <div className="size-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
                        <span className="material-symbols-outlined text-white text-3xl">store</span>
                    </div>
                    <h1 className="text-3xl font-black text-main tracking-tight">Kerabat POS</h1>
                    <p className="text-sm text-muted">Masuk ke sistem kasir</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="card p-8 space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-black text-muted uppercase tracking-widest">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="kasir@kerabat.com"
                            className="w-full h-12 px-4 rounded-xl border border-border-dim bg-surface text-main text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-black text-muted uppercase tracking-widest">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full h-12 px-4 rounded-xl border border-border-dim bg-surface text-main text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                            <span className="material-symbols-outlined text-sm shrink-0">error</span>
                            <p className="text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-xl">login</span>
                                Masuk
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-muted">
                    Hubungi administrator untuk akun baru.
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
