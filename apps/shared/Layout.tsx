import React, { useState } from 'react';
import NavDrawer from './NavDrawer';
import ThemeToggle from './ThemeToggle';
import { useSession } from './authClient';
import AuthPage from './AuthPage';
import { Toaster } from 'react-hot-toast';

interface LayoutProps {
    children: React.ReactNode;
    currentPort: number;
    title: string;
    subtitle?: string;
    sidebar?: React.ReactNode;
    headerExtras?: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    currentPort, 
    title, 
    subtitle,
    sidebar, 
    headerExtras,
    footer,
    maxWidth = '1600px'
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const { data: session, isPending, refetch, error: sessionError } = useSession();

    React.useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        const handleBeforeInstallPrompt = (e: any) => {
            console.log('✅ PWA beforeinstallprompt fired');
            e.preventDefault();
            setDeferredPrompt(e);
        };
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            console.log('🎉 PWA was successfully installed');
        };

        console.log('🔍 Initializing PWA listeners...');
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 App is already running in standalone mode');
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

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
                <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                    <div className="relative accent-glow">
                        <div className="size-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-4xl">local_cafe</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight">{title}</h1>
                        {subtitle && <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 font-bold leading-tight">{subtitle}</p>}
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-[0.4em] text-primary animate-pulse">
                            {retryCount > 0 ? `Sinkronisasi (${retryCount}/${maxRetries})` : 'Membuka Kerabat'}
                        </h2>
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-80">Menyiapkan pengalaman premium Anda...</p>
                        {retryCount > 1 && (
                            <div className="glass px-6 py-2 rounded-full animate-bounce">
                                <p className="text-[10px] text-primary font-black uppercase">Server sedang bersiap...</p>
                            </div>
                        )}
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
                <div className="w-full max-w-md space-y-10 animate-in slide-in-from-bottom duration-500">
                    <div className="text-center space-y-6">
                        <div className="size-28 rounded-[2.5rem] accent-gradient flex items-center justify-center text-slate-950 mx-auto shadow-2xl shadow-primary/30 rotate-3">
                            <span className="material-symbols-outlined text-5xl">wifi_off</span>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tight font-display">Koneksi Terhambat</h2>
                            <p className="text-base text-[var(--text-muted)] font-medium">
                                [DEBUG-V2] {sessionError instanceof Error ? `(${ (sessionError as any).status || '???' }) ${sessionError.message}` : 'Server tidak dapat dijangkau dari jaringan Anda.'}
                            </p>
                        </div>
                    </div>

                    <div className="glass rounded-[2rem] p-8 space-y-6">
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
        <div className="bg-[var(--bg-app)] text-[var(--text-main)] antialiased min-h-screen w-full transition-colors duration-500 overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={currentPort} />

            {/* Offline Mode Banner */}
            {isOffline && (
                <div className="fixed top-0 inset-x-0 z-[1000] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300 shadow-lg">
                    <span className="material-symbols-outlined text-lg animate-pulse">signal_wifi_off</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Offline Mode: Koneksi Terputus. Data mungkin tidak akurat.</span>
                </div>
            )}
            
            <div className={`flex flex-col h-screen lg:flex-row mx-auto bg-[var(--bg-app)] relative w-full overflow-hidden`} style={{ maxWidth }}>
                
                {/* Desktop Sidebar (Floating Glass Effect) */}
                {sidebar && (
                    <aside className="hidden lg:flex w-80 h-[calc(100vh-2.5rem)] sticky top-5 ml-5 my-5 glass rounded-[3rem] flex-col p-8 space-y-10 z-20">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl accent-gradient flex items-center justify-center text-slate-950 shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined font-black">coffee</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Kerabat POS</p>
                                <h1 className="text-xl font-black tracking-tight truncate font-display leading-tight">{title}</h1>
                                {subtitle && <p className="text-[9px] font-black text-primary uppercase tracking-widest truncate opacity-80">{subtitle}</p>}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto hide-scrollbar pr-2 -mr-2">
                            {sidebar}
                        </div>
                    </aside>
                )}

                {/* Main Viewport */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    {/* Shell Header (Glass) */}
                    <header className="p-3 md:px-6 md:py-4 shrink-0 w-full z-10">
                        <div className="glass rounded-2xl md:rounded-[2rem] px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-3 h-16 w-full max-w-full relative shadow-sm">
                            
                            {/* Kiri: Hamburger + Logo */}
                            <div className="flex items-center gap-3 shrink-0 flex-1 justify-start">
                                <button 
                                    onClick={() => setDrawerOpen(true)} 
                                    className="size-10 flex items-center justify-center shrink-0 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95"
                                    style={{ backgroundColor: 'var(--primary-glow)', color: 'var(--primary)' }}
                                >
                                    <span className="material-symbols-outlined text-[20px] font-black">menu</span>
                                </button>
                                
                                {!sidebar && (
                                     <div className="size-10 hidden sm:flex shrink-0 rounded-xl accent-gradient items-center justify-center text-slate-950 shadow-md">
                                        <span className="material-symbols-outlined text-[20px]">coffee</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Tengah: Kosong atau Navigasi Tambahan */}
                            <div className="flex-1 min-w-0"></div>

                            {/* Kanan: Header Extras & Theme Toggle */}
                            <div className="flex items-center gap-1 sm:gap-4 shrink-0 flex-1 justify-end min-w-0">
                                {headerExtras && (
                                    <div className="flex items-center gap-1 sm:gap-2 shrink min-w-0 overflow-hidden">
                                        {headerExtras}
                                    </div>
                                )}
                                
                                {deferredPrompt && (
                                    <button 
                                        onClick={handleInstallClick}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all active:scale-95 shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-lg">install_mobile</span>
                                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">Install App</span>
                                    </button>
                                )}

                                <div className="h-6 w-px bg-[var(--border-dim)] mx-1 hidden sm:block"></div>

                                <div className="shrink-0 scale-90 sm:scale-100">
                                    <ThemeToggle />
                                </div>
                            </div>

                        </div>
                    </header>

                    {/* Content Area */}
                    <main className="flex-1 px-4 md:px-10 pb-10 overflow-y-auto custom-scrollbar">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Page Header (New Location) */}
                            <div className="mt-4 md:mt-8 mb-8 md:mb-12 px-2">
                                <p className="text-[10px] md:text-xs font-black text-primary uppercase tracking-[0.4em] mb-1 opacity-80">{subtitle}</p>
                                <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase text-[var(--text-main)] leading-none">{title}</h1>
                            </div>
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
    );
};

export default Layout;
