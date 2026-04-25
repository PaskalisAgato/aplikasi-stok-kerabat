import React, { useState } from 'react';
import NavDrawer from './NavDrawer';
import { ThemeProvider } from './hooks/ThemeContext';
import { useSession } from './authClient';
import AuthPage from './AuthPage';
import { Toaster } from 'react-hot-toast';
import { PerformanceSettings } from './services/performance';

interface LayoutProps {
    children: React.ReactNode;
    currentPort: number;
    title: string;
    subtitle?: string;
    sidebar?: React.ReactNode;
    headerExtras?: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    hideHeader?: boolean;
    hideTitle?: boolean;
    onDrawerOpen?: () => void;
    drawerOpen?: boolean;
    onDrawerClose?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    currentPort, 
    title, 
    subtitle,
    sidebar, 
    headerExtras,
    footer,
    maxWidth = '1600px',
    hideHeader = false,
    hideTitle = false,
    onDrawerOpen,
    drawerOpen: externalDrawerOpen,
    onDrawerClose: onExternalDrawerClose,
}) => {
    const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
    const drawerOpen = externalDrawerOpen !== undefined ? externalDrawerOpen : internalDrawerOpen;
    const setDrawerOpen = (val: boolean) => {
        if (externalDrawerOpen !== undefined) {
            if (val && onDrawerOpen) onDrawerOpen();
            if (!val && onExternalDrawerClose) onExternalDrawerClose();
        } else {
            setInternalDrawerOpen(val);
        }
    };
    const [isOffline, setIsOffline] = useState(false);
    const { data: session, isPending, refetch, error: sessionError } = useSession();

    React.useEffect(() => {
        setIsOffline(typeof window !== 'undefined' ? !navigator.onLine : false);
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (sessionError) console.error("Session verification failed:", sessionError);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const maxRetries = 3;

    // Secondary check for manual token to avoid flicking to login on Safari
    const hasManualToken = typeof window !== 'undefined' && !!localStorage.getItem('kerabat_auth_token');

    // Resilient retry logic with exponential backoff
    React.useEffect(() => {
        // If we get an explicit auth error (401/403), stop retrying and clear token
        if (sessionError && (sessionError as any).status >= 401 && (sessionError as any).status <= 403) {
            console.warn("Auth token invalid, clearing storage...");
            const hadToken = !!localStorage.getItem('kerabat_auth_token');
            localStorage.removeItem('kerabat_auth_token');
            if (hadToken) {
                window.location.reload();
            }
            return;
        }

        if (!isPending && !session && hasManualToken && retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
            setIsRetrying(true);
            
            const timer = setTimeout(() => {
                console.log(`Session check failed, retrying (${retryCount + 1}/${maxRetries}) in ${delay}ms...`);
                setRetryCount(prev => prev + 1);
                refetch().finally(() => setIsRetrying(false));
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [session, isPending, hasManualToken, refetch, retryCount, sessionError]);

    if (isPending || isRetrying) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-8 text-center overflow-hidden">
                <div className="flex flex-col items-center gap-10">
                    <div className="relative">
                        <div className="size-32 rounded-full border-[1px] border-primary/10 border-t-primary animate-spin duration-[2000ms]"></div>
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-primary text-5xl">local_cafe</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight">{title}</h1>
                        {subtitle && <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] opacity-90 font-bold leading-tight">{subtitle}</p>}
                    </div>
                    <div className="space-y-5">
                        <h2 className="text-sm font-black uppercase tracking-[0.5em] text-primary">
                            {retryCount > 0 ? `Sinkronisasi (${retryCount}/${maxRetries})` : 'Menyiapkan Pengalaman'}
                        </h2>
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] opacity-60">Kemewahan dalam setiap tegukan...</p>
                            {retryCount > 1 && (
                                <div className="bg-primary/5 px-6 py-2 rounded-full border border-primary/10">
                                    <p className="text-[9px] text-primary font-black uppercase tracking-widest">Server sedang memanaskan mesin...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!session && !hasManualToken) {
        return <AuthPage />;
    }

    // Network Diagnostic / Connection Issue Screen
    if (!session && retryCount >= maxRetries) {
        return (
            <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 text-[var(--text-main)]">
                <div className="w-full max-w-md space-y-10">
                    <div className="text-center space-y-6">
                        <div className="size-28 rounded-[2.5rem] accent-gradient flex items-center justify-center text-[var(--text-main)] mx-auto shadow-2xl shadow-primary/30">
                            <span className="material-symbols-outlined text-5xl">wifi_off</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tight font-display">Koneksi Terhambat</h2>
                            <p className="text-base text-[var(--text-muted)] font-medium">
                                [DEBUG-V2] {sessionError instanceof Error ? `(${ (sessionError as any).status || '???' }) ${sessionError.message}` : 'Server tidak dapat dijangkau dari jaringan Anda.'}
                            </p>
                        </div>
                    </div>

                    <div className={`${PerformanceSettings.getGlassClass()} rounded-[2rem] p-8 space-y-6`}>
                        <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Langkah Perbaikan:</p>
                        <div className="space-y-5">
                            {[
                                { icon: 'vpn_lock', text: 'Gunakan **VPN** atau ganti ke **Data Seluler**.' },
                                { icon: 'dns', text: 'Aktifkan **DNS Aman** di pengaturan Browser.' },
                                { icon: 'refresh', text: 'Pastikan koneksi internet Anda stabil.' }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-xl">{step.icon}</span>
                                    </div>
                                    <p className="text-sm font-semibold opacity-90">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full text-base"
                        >
                            COBA LAGI SEKARANG
                        </button>
                        <button 
                            onClick={() => {
                                localStorage.removeItem('kerabat_auth_token');
                                window.location.reload();
                            }}
                            className="w-full py-4 text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
                        >
                            Log Out & Kembali ke Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider>
            <div className="bg-[var(--bg-app)] text-[var(--text-main)] antialiased min-h-screen w-full transition-colors duration-500 overflow-hidden">
                <Toaster position="top-right" reverseOrder={false} />
                <NavDrawer 
                    open={drawerOpen} 
                    onClose={() => setDrawerOpen(false)} 
                    currentPort={currentPort}
                />

                {/* Offline Mode Banner */}
                {isOffline && (
                    <div className="fixed top-0 inset-x-0 z-[1000] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg">
                        <span className="material-symbols-outlined text-lg">signal_wifi_off</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Offline Mode: Koneksi Terputus. Data mungkin tidak akurat.</span>
                    </div>
                )}
                
                <div className={`flex flex-col h-screen lg:flex-row mx-auto bg-[var(--bg-app)] relative w-full overflow-hidden`} style={{ maxWidth }}>
                    
                    {/* Desktop Sidebar (Floating Coffee Grain Effect) */}
                    {sidebar && (
                        <aside className={`hidden lg:flex w-84 h-[calc(100vh-3rem)] sticky top-6 ml-6 my-6 bg-[var(--secondary)] text-[var(--text-main)] rounded-[3.5rem] flex-col p-10 space-y-12 z-20 shadow-2xl border border-white/5`}>
                            <div className="flex flex-col gap-6">
                                <div className="size-16 rounded-[1.75rem] bg-gradient-to-br from-primary to-danger flex items-center justify-center text-white shadow-xl shadow-primary/20 group hover:scale-105 transition-transform duration-500">
                                    <span className="material-symbols-outlined font-black text-2xl group-hover:rotate-[360deg] transition-transform duration-700">local_cafe</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Authentic Experience</p>
                                    <h1 className="text-2xl font-black tracking-tight text-[#fefae0] font-display leading-tight">{title}</h1>
                                    {subtitle && <p className="text-[10px] font-bold text-[#fefae0]/50 uppercase tracking-[0.3em] truncate">{subtitle}</p>}
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2 space-y-6">
                                {sidebar}
                            </div>
                        </aside>
                    )}

                    {/* Main Viewport */}
                    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                        {/* Shell Header (Glass) - Changed to fixed for robustness on mobile */}
                        {!hideHeader && !drawerOpen && (
                            <header 
                                className="fixed top-0 left-0 right-0 lg:relative p-4 md:px-10 md:py-8 shrink-0 w-full z-40"
                                style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
                            >
                                <div className={`${PerformanceSettings.getGlassClass()} rounded-[2rem] md:rounded-[2.5rem] px-5 md:px-10 py-3 md:py-4 flex items-center justify-between gap-4 h-20 w-full max-w-full relative shadow-[var(--card-shadow)] border-primary/5`}>
                                    
                                    {/* Kiri: Hamburger + App Identity */}
                                    <div className="flex items-center gap-4 shrink-0 justify-start">
                                        <button 
                                            onClick={() => setDrawerOpen(true)} 
                                            className="size-11 flex items-center justify-center shrink-0 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm border border-primary/10"
                                        >
                                            <span className="material-symbols-outlined text-[24px] font-black">menu</span>
                                        </button>
                                        
                                        {!sidebar && (
                                             <div className="flex flex-col xs:flex items-start">
                                                <h1 className="text-sm md:text-lg font-black tracking-tighter text-[var(--text-main)] uppercase leading-none">{title}</h1>
                                                {subtitle && <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] hidden sm:block">{subtitle}</p>}
                                             </div>
                                        )}
                                    </div>
                                    
                                    {/* Tengah: Mobile Logo (only if no sidebar) */}
                                    <div className="flex-1 flex justify-center lg:hidden">
                                        {!sidebar && (
                                            <div className="size-10 rounded-[1.25rem] bg-primary flex items-center justify-center text-white shadow-lg animate-pulse">
                                                <span className="material-symbols-outlined font-black text-xl">local_cafe</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Kanan: Header Extras */}
                                    <div className="flex items-center gap-4 shrink-0 justify-end">
                                        {headerExtras && (
                                            <div className="flex items-center shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
                                                {headerExtras}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </header>
                        )}

                        {/* Content Area - Added spacer for fixed mobile header */}
                        <main className="flex-1 px-4 md:px-10 pb-10 pt-[110px] lg:pt-0 overflow-y-auto custom-scrollbar relative">
                            <div>
                                {/* Page Header (New Location) */}
                                {!hideTitle && (
                                    <div className="mt-10 md:mt-8 mb-6 md:mb-12 px-2">
                                        <p className="text-[9px] md:text-xs font-black text-primary uppercase tracking-[0.4em] mb-1 opacity-80">{subtitle}</p>
                                        <h1 className="text-xl md:text-4xl font-black tracking-tighter uppercase text-[var(--text-main)] leading-none">{title}</h1>
                                    </div>
                                )}
                                {children}
                            </div>
                        </main>

                        {/* Fixed Footer */}
                        {footer && (
                            <div className="shrink-0">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default Layout;
