import React from 'react';
import { NAV_LINKS, getTargetUrl } from './navigation';
import { useSession } from './authClient';
import ThemeToggle from './ThemeToggle';
import { usePWAInstall } from './hooks/usePWAInstall';

interface NavDrawerProps {
    open: boolean;
    onClose: () => void;
    currentPort?: number;
}

const NavDrawer: React.FC<NavDrawerProps> = ({ open, onClose, currentPort }) => {
    const { isInstallable, deferredPrompt, handleInstall } = usePWAInstall();
    const { data: session } = useSession();
    // session shape: { id, userId, expiresAt, user: { id, name, email, role } }
    // NEVER fallback to 'Karyawan' if we have a session — that hides bugs
    const userRole = session?.user?.role || (session ? 'Unknown' : 'Karyawan');
    const [isStandalone, setIsStandalone] = React.useState(false);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        }
    }, [open]);

    if (!open) return null;

    // Filter links based on role
    const filteredLinks = NAV_LINKS.filter(link => {
        if (userRole === 'Admin') return true; // Admin sees everything
        return link.requiredRole === 'Karyawan'; // Karyawan only sees Karyawan-level links
    });

    const handleLogout = async () => {
        if (!confirm('Apakah Anda yakin ingin keluar?')) return;

        try {
            // Get token BEFORE clearing storage
            const token = localStorage.getItem('kerabat_auth_token');
            
            // 1. Call backend logout to destroy server-side session & cookies
            await fetch('https://aplikasi-stok-kerabat.onrender.com/api/auth/logout-manual', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            }).catch(err => console.error("Logout fetch failed:", err));

            // 2. Nuke ALL client-side auth state
            localStorage.clear();
            sessionStorage.clear();

            // 3. Force reload current path (Login UI is inline, no /login route)
            const currentPath = window.location.pathname;
            window.location.href = `${window.location.origin}${currentPath}?v=${Date.now()}`;
        } catch (error) {
            console.error("Logout error:", error);
            localStorage.clear();
            sessionStorage.clear();
            const currentPath = window.location.pathname;
            window.location.href = `${window.location.origin}${currentPath}?v=${Date.now()}`;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />
            <div className={`
                relative w-80 max-w-[85vw] h-full flex flex-col glass border-r-0 rounded-r-[3rem] 
                shadow-2xl animate-in slide-in-from-left duration-500 ease-out pointer-events-auto
            `}>
                <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl accent-gradient flex items-center justify-center text-slate-950 shadow-lg">
                            <span className="material-symbols-outlined font-black text-xl">coffee</span>
                        </div>
                        <h2 className="text-lg font-black font-display tracking-tight">Main Menu</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="size-9 flex items-center justify-center text-[var(--text-muted)] hover:text-primary hover:bg-primary/10 rounded-2xl transition-all"
                    >
                        <span className="material-symbols-outlined font-bold text-xl">close</span>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-2 space-y-2 hide-scrollbar">
                    <p className="px-4 pb-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80">Navigasi Utama</p>
                    {filteredLinks.map((link) => {
                        const isActive = currentPort === link.port;
                        const targetUrl = getTargetUrl(link.port);

                        return (
                            <a
                                key={link.port}
                                href={isActive ? '#' : targetUrl}
                                onClick={(e) => {
                                    if (isActive) {
                                        e.preventDefault();
                                        onClose();
                                    } else {
                                        // Hard reload for cross-app navigation to ensure Vercel serves the correct app
                                        e.preventDefault();
                                        window.location.href = targetUrl;
                                    }
                                }}
                                className={`
                                    flex items-center gap-4 px-4 py-3 rounded-[1.25rem] transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/30 accent-glow translate-x-1'
                                        : 'text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] hover:translate-x-1'}
                                `}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive ? 'font-black' : 'group-hover:text-primary transition-colors'}`}>
                                    {link.icon}
                                </span>
                                <span className={`font-semibold tracking-wide text-xs ${isActive ? 'text-slate-950 font-black' : ''}`}>
                                    {link.label}
                                </span>
                            </a>
                        );
                    })}
                </nav>
                    <div className="p-6 mt-auto space-y-4">
                        <div className="space-y-3">
                            <p className="px-4 text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80">Pengaturan</p>
                            <div className="glass rounded-[1.5rem] p-1.5 flex items-center justify-between border-white/5">
                                <div className="flex items-center gap-3 px-3 py-1">
                                    <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-xs font-bold">contrast</span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tampilan</span>
                                </div>
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="glass rounded-[1.5rem] p-3 flex flex-col gap-2 shadow-2xl border-white/10">
                            <p className="px-3 text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80 mb-1">Aplikasi & Sistem</p>
                            
                            <div className="flex flex-col gap-2">
                                {isInstallable && (
                                    <button 
                                        onClick={() => {
                                            handleInstall();
                                            onClose();
                                        }}
                                        className="w-full h-11 flex items-center gap-4 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-slate-950 transition-all font-black text-[10px] uppercase tracking-widest group border border-primary/10 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined font-black text-lg group-hover:scale-110 transition-transform">{deferredPrompt ? 'download_for_offline' : 'install_mobile'}</span>
                                        <span>Download App</span>
                                    </button>
                                )}

                                <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group flex-wrap gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)] group-hover:text-primary transition-colors">
                                            {isStandalone ? 'pwa_notes' : 'public'}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                            {isStandalone ? 'PWA Aktif' : 'Running via Browser'}
                                        </span>
                                    </div>
                                    <div className={`size-1.5 rounded-full ${isStandalone ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                </div>
                            </div>
                            
                            <div className="h-px bg-white/5 my-1" />

                            <div className="flex items-center gap-3 px-3 py-1">
                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined font-bold text-lg">account_circle</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black truncate">{session?.user?.name || 'User'}</p>
                                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{userRole}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined font-black text-xl">logout</span>
                                <span>Keluar Sistem</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default NavDrawer;
