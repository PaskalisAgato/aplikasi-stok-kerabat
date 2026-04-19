import React, { useState } from 'react';
import { API_BASE_URL } from './apiClient';

type AuthMode = 'select' | 'pin';
type Role = 'Admin' | 'Karyawan';

export const AuthPage: React.FC<{ onSuccess?: () => void }> = () => {
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
            // Ensure we use the correct modular path /api/auth/login-pin
            const response = await fetch(`${API_BASE_URL}/auth/login-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role, pin })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Login gagal. Silakan cek PIN Anda.');
            } else {
                // Success - save the token to localStorage as a fallback for iOS
                const sessId = data.session?.id || data.sessionId;
                if (sessId) {
                    localStorage.setItem('kerabat_auth_token', sessId);
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const isNetworkError = err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Network');
            setError(isNetworkError 
                ? 'Koneksi Terblokir: Sistem tidak dapat menjangkau server.'
                : `Kesalahan: ${err.message || 'Coba lagi nanti'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 text-[var(--text-main)] overflow-y-auto relative">
            <div className="absolute top-[-10%] left-[-10%] size-[40vw] rounded-full bg-primary/5 blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] size-[40vw] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none"></div>

            <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-300 relative z-10">
                <div className="text-center space-y-4">
                    <div className="size-24 rounded-[2rem] accent-gradient flex items-center justify-center mx-auto shadow-2xl shadow-primary/40 mb-6 transform hover:scale-110 hover:rotate-3 transition-all cursor-default">
                        <span className="material-symbols-outlined text-[var(--text-main)] text-5xl font-black">coffee</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-5xl font-black tracking-tighter font-display">KERABAT<span className="text-primary italic">.</span></h1>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.3em] text-[10px] opacity-80">Sistem Kasir Premium v1.0</p>
                    </div>
                </div>

                {mode === 'select' ? (
                    <div className="grid grid-cols-2 gap-8 p-2">
                        {[
                            { id: 'Admin', label: 'ADMIN', icon: 'admin_panel_settings', desc: 'Kelola Sistem' },
                            { id: 'Karyawan', label: 'STAF', icon: 'badge', desc: 'Operasional' }
                        ].map((r) => (
                            <button 
                                key={r.id}
                                onClick={() => handleRoleSelect(r.id as Role)}
                                className="aspect-square glass rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:scale-105 transition-transform group relative overflow-hidden active:scale-95"
                            >
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-200"></div>
                                <div className="size-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-slate-950 transition-[background-color,color,box-shadow] duration-200 shadow-lg group-hover:shadow-primary/40">
                                    <span className="material-symbols-outlined text-4xl">{r.icon}</span>
                                </div>
                                <div className="text-center">
                                    <span className="font-black tracking-[0.2em] text-xs uppercase block">{r.label}</span>
                                    <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{r.desc}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="glass rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom-5 duration-300 ease-out shadow-2xl shadow-black/20">
                        <div className="p-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setMode('select')} 
                                    className="size-12 rounded-2xl hover:bg-primary/10 flex items-center justify-center text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined font-black">arrow_back</span>
                                </button>
                                <div className="flex-1 text-center pr-12">
                                    <h2 className="text-2xl font-black font-display tracking-tight uppercase">{role} LOGIN</h2>
                                    <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase opacity-70">Masukkan PIN Keamanan</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-4">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className={`size-4 rounded-full border-2 transition-all duration-300 ${pin.length >= i ? 'bg-primary border-primary scale-125 accent-glow' : 'border-[var(--border-dim)]'}`} />
                                ))}
                            </div>

                            {error && (
                                <div className="glass bg-red-500/10 border-red-500/20 text-red-500 p-5 rounded-[1.5rem] text-xs font-bold flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                    <span className="material-symbols-outlined text-base font-black">warning</span>
                                    <span className="flex-1">{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-5 pb-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                    <button 
                                        key={n} 
                                        onClick={() => handleNumberClick(n.toString())}
                                        className="h-20 rounded-[1.5rem] glass hover:bg-primary hover:text-slate-950 text-2xl font-black transition-[background-color,color,transform,box-shadow] duration-200 active:scale-90 hover:shadow-lg hover:shadow-primary/20"
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button className="h-20" />
                                <button 
                                    onClick={() => handleNumberClick('0')}
                                    className="h-20 rounded-[1.5rem] glass hover:bg-primary hover:text-slate-950 text-2xl font-black transition-all active:scale-90"
                                >
                                    0
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="h-20 rounded-[1.5rem] glass hover:text-red-500 transition-all flex items-center justify-center active:scale-90"
                                >
                                    <span className="material-symbols-outlined text-3xl font-black">backspace</span>
                                </button>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={isLoading || pin.length < 4}
                                className={`btn-primary w-full h-20 text-xl font-black tracking-widest ${isLoading || pin.length < 4 ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? <span className="material-symbols-outlined animate-spin font-black text-3xl">sync</span> : 'MASUK SEKARANG'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4 pt-4">
                     <p className="text-center text-[9px] text-[var(--text-muted)] font-black tracking-[0.4em] uppercase opacity-40">
                        &copy; 2026 Kerabat Coffee . Experience Excellence
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
