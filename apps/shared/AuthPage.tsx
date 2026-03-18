import React, { useState } from 'react';

type AuthMode = 'select' | 'pin';
type Role = 'Admin' | 'Karyawan';

export const AuthPage: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('select');
    const [role, setRole] = useState<Role | null>(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRoleSelect = (selectedRole: Role) => {
        setRole(selectedRole);
        setMode('pin');
        setPin('');
        setError(null);
    };

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length >= 4) {
               // Optional: trigger login automatically or wait for submit
            }
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (!role || pin.length < 4) return;
        
        setError(null);
        setIsLoading(true);

        try {
            const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || 'https://aplikasi-stok-kerabat.onrender.com/api';
            const response = await fetch(`${apiBaseUrl}/auth/login-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important for cross-origin cookies
                body: JSON.stringify({ role, pin })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login gagal');
            } else {
                // Success - save the token to localStorage as a fallback for iOS
                if (data.session?.id) {
                    localStorage.setItem('kerabat_auth_token', data.session.id);
                    console.log('Session token saved:', data.session.id);
                }
                
                // Wait slightly for localStorage to settle and for some mobile browsers
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const isNetworkError = err.message?.includes('fetch') || err.message?.includes('Network');
            setError(isNetworkError 
                ? 'Kesalahan Jaringan: Koneksi Terblokir (Coba matikan "Hide IP Address" di Pengaturan Safari atau gunakan WiFi lain/VPN)'
                : `Kesalahan: ${err.message || 'Coba lagi nanti'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-app flex items-center justify-center p-6 text-main">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center space-y-2">
                    <div className="size-20 rounded-3xl bg-primary flex items-center justify-center mx-auto shadow-2xl shadow-primary/40 mb-4 transform hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-white text-4xl">store</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter">KERABAT POS</h1>
                    <p className="text-muted font-medium">Sistem Inventori & Kasir Terpadu</p>
                </div>

                {mode === 'select' ? (
                    <div className="grid grid-cols-2 gap-6 p-2">
                        <button 
                            onClick={() => handleRoleSelect('Admin')}
                            className="aspect-square bg-surface border border-border-dim rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-primary transition-all hover:shadow-xl group"
                        >
                            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
                            </div>
                            <span className="font-black tracking-widest text-sm uppercase">ADMIN</span>
                        </button>
                        <button 
                            onClick={() => handleRoleSelect('Karyawan')}
                            className="aspect-square bg-surface border border-border-dim rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-primary transition-all hover:shadow-xl group"
                        >
                            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-3xl">badge</span>
                            </div>
                            <span className="font-black tracking-widest text-sm uppercase">KARYAWAN</span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-surface rounded-3xl border border-border-dim shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setMode('select')} className="size-10 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <div className="flex-1 text-center pr-10">
                                    <h2 className="text-xl font-black">LOGIN {role}</h2>
                                    <p className="text-xs text-muted font-bold tracking-widest uppercase">MASUKKAN PIN ANDA</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className={`size-4 rounded-full border-2 transition-all duration-300 ${pin.length >= i ? 'bg-primary border-primary scale-125' : 'border-border-dim'}`} />
                                ))}
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-pulse">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 pb-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                    <button 
                                        key={n} 
                                        onClick={() => handleNumberClick(n.toString())}
                                        className="h-16 rounded-2xl bg-background-app hover:bg-primary hover:text-white text-xl font-black transition-all active:scale-95"
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button className="h-16" /> {/* Placeholder */}
                                <button 
                                    onClick={() => handleNumberClick('0')}
                                    className="h-16 rounded-2xl bg-background-app hover:bg-primary hover:text-white text-xl font-black transition-all active:scale-95"
                                >
                                    0
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="h-16 rounded-2xl bg-background-app hover:text-red-500 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-2xl">backspace</span>
                                </button>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={isLoading || pin.length < 4}
                                className={`w-full h-16 rounded-2xl text-white font-black text-lg transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 ${isLoading || pin.length < 4 ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-primary hover:shadow-primary/30'}`}
                            >
                                {isLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'LOGIN SEKARANG'}
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-center text-[10px] text-muted font-bold tracking-[0.2em] uppercase opacity-50">
                    &copy; 2026 Kerabat Coffee . All Rights Reserved
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
