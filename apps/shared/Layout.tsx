import React, { useState } from 'react';
import NavDrawer from './NavDrawer';
import ThemeToggle from './ThemeToggle';
import { useSession } from './authClient';
import AuthPage from './AuthPage';

interface LayoutProps {
    children: React.ReactNode;
    currentPort: number;
    title: string;
    sidebar?: React.ReactNode;
    headerExtras?: React.ReactNode;
    maxWidth?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    currentPort, 
    title, 
    sidebar, 
    headerExtras,
    maxWidth = '1600px'
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { data: session, isPending, refetch, error: sessionError } = useSession();
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const maxRetries = 3;

    // Secondary check for manual token to avoid flicking to login on Safari
    const hasManualToken = typeof window !== 'undefined' && !!localStorage.getItem('kerabat_auth_token');

    // Resilient retry logic with exponential backoff
    React.useEffect(() => {
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
    }, [session, isPending, hasManualToken, refetch, retryCount]);

    if (isPending || isRetrying) {
        return (
            <div className="min-h-screen bg-background-app flex items-center justify-center p-6 text-center">
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                    <div className="relative">
                        <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
                        <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-primary/30 text-2xl">shield_person</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">
                            {retryCount > 0 ? `Menghubungkan Ulang (${retryCount}/${maxRetries})` : 'Memeriksa Sesi'}
                        </p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-60">Mohon Tunggu Sebentar...</p>
                        {retryCount > 1 && (
                            <p className="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-full animate-bounce">Server sedang dibangunkan...</p>
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
            <div className="min-h-screen bg-background-app flex items-center justify-center p-6 text-main">
                <div className="w-full max-w-sm space-y-8 animate-in zoom-in duration-300">
                    <div className="text-center space-y-4">
                        <div className="size-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto border-2 border-orange-500/20">
                            <span className="material-symbols-outlined text-4xl">cloud_off</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Koneksi Terhambat</h2>
                        <p className="text-sm text-muted font-medium">Sistem tidak dapat menjangkau server di iPhone Anda (Kemungkinan diblokir ISP).</p>
                    </div>

                    <div className="bg-surface border border-border-dim rounded-3xl p-6 space-y-4 shadow-xl">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Solusi Perbaikan:</p>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <span className="bg-primary text-white size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                                <p className="text-xs font-medium">Gunakan **VPN** atau matikan WiFi (coba Data Seluler).</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="bg-primary text-white size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                                <p className="text-xs font-medium">Aktifkan **DNS Aman** di Chrome (Setelan &gt; Privasi &gt; Gunakan DNS Aman).</p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="bg-primary text-white size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                                <p className="text-xs font-medium">Cek kuota internet dan pastikan sinyal stabil.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-sm"
                        >
                            COBA LAGI SEKARANG
                        </button>
                        <button 
                            onClick={() => {
                                localStorage.removeItem('kerabat_auth_token');
                                window.location.reload();
                            }}
                            className="w-full py-4 bg-surface text-muted font-bold rounded-2xl border border-border-dim text-xs active:scale-95 transition-all"
                        >
                            KEMBALI KE LOGIN
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-app text-main antialiased font-display min-h-screen w-full transition-colors duration-300">
            {/* Hidden NavDrawer for mobile overlay */}
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={currentPort} />
            
            <div className={`flex flex-col min-h-screen lg:flex-row mx-auto shadow-2xl border-x border-border-dim bg-background-app`} style={{ maxWidth }}>
                
                {/* Desktop Sidebar (Optional) */}
                {sidebar && (
                    <aside className="hidden lg:flex w-72 h-screen sticky top-0 bg-surface border-r border-border-dim flex-col p-6 space-y-8 z-20">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setDrawerOpen(true)} 
                                className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
                                title="Open Sidebar"
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <h1 className="text-xl font-black tracking-tight truncate">{title}</h1>
                        </div>
                        <div className="flex-1 overflow-y-auto hide-scrollbar">
                            {sidebar}
                        </div>
                    </aside>
                )}

                {/* Main Viewport */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Shell Header */}
                    <header className="sticky top-0 z-30 bg-background-app/80 backdrop-blur-md px-4 md:px-6 py-4 border-b border-border-dim shadow-sm">
                        <div className="flex items-center gap-4">
                            {/* Mobile Menu Trigger OR Desktop Trigger (if no sidebar) */}
                            <button 
                                onClick={() => setDrawerOpen(true)} 
                                className={`${sidebar ? 'lg:hidden' : ''} size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95`}
                            >
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            
                            {!sidebar && <h1 className="text-xl font-black tracking-tight truncate">{title}</h1>}
                            
                            <div className="flex-1"></div>
                            
                            <div className="flex items-center gap-2">
                                {headerExtras}
                                <ThemeToggle />
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <main className="flex-1 p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;
