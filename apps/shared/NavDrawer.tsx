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
            await fetch('https://api.kerabatkopitiam.my.id/api/auth/logout-manual', {
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
        <div className="fixed inset-0 z-[200] flex">
            <div
                className="absolute inset-0 bg-[#1a1212]/80 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />
            <div className={`
                relative w-84 max-w-[85vw] h-full flex flex-col bg-[var(--bg-app)] border-r border-primary/10 rounded-r-[3.5rem] 
                shadow-2xl animate-in slide-in-from-left duration-500 ease-out pointer-events-auto overflow-hidden
            `}>
                <div className="flex items-center justify-between p-8">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] leading-none">Navigation</p>
                        <h2 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)]">Main Menu</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="size-11 flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-primary rounded-2xl transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined font-black text-2xl">close</span>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-3 hide-scrollbar">
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
                                        e.preventDefault();
                                        window.location.href = targetUrl;
                                    }
                                }}
                                className={`
                                    flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group relative
                                    ${isActive
                                        ? 'bg-[var(--secondary)] text-[#fefae0] font-black shadow-xl translate-x-2'
                                        : 'text-[var(--text-muted)] hover:bg-primary/5 hover:text-primary hover:translate-x-2'}
                                `}
                            >
                                {isActive && <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-primary rounded-full" />}
                                <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-primary scale-110' : 'group-hover:scale-110 transition-transform'}`}>
                                    {link.icon}
                                </span>
                                <span className={`font-black uppercase tracking-widest text-[10px] ${isActive ? '' : ''}`}>
                                    {link.label}
                                </span>
                            </a>
                        );
                    })}
                </nav>

                <div className="p-8 mt-auto space-y-6">
                    <div className="space-y-4">
                        <div className="bg-[var(--secondary)]/5 rounded-[2rem] p-2 flex items-center justify-between border border-primary/5">
                            <div className="flex items-center gap-3 px-4 py-2">
                                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-base font-black">contrast</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Mode</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>

                    <div className="bg-[var(--secondary)] text-[#fefae0] rounded-[2.5rem] p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 size-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
                        
                        <div className="relative space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined font-black text-2xl">account_circle</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black truncate text-white">{session?.user?.name || 'User'}</p>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">{userRole}</p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                {isInstallable && (
                                    <button 
                                        onClick={() => {
                                            handleInstall();
                                            onClose();
                                        }}
                                        className="w-full h-12 flex items-center gap-4 px-5 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined font-black text-xl">{deferredPrompt ? 'download_for_offline' : 'install_mobile'}</span>
                                        <span>Download App</span>
                                    </button>
                                )}

                                <button 
                                    onClick={handleLogout}
                                    className="w-full h-12 flex items-center gap-4 px-5 rounded-2xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-all font-black text-[10px] uppercase tracking-widest text-white/60"
                                >
                                    <span className="material-symbols-outlined font-black text-xl">logout</span>
                                    <span>Keluar Sistem</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[10px] text-primary">
                                    {isStandalone ? 'verified_user' : 'language'}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                    {isStandalone ? 'Encrypted App' : 'Web Access'}
                                </span>
                            </div>
                            <div className={`size-1.5 rounded-full ${isStandalone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-primary'}`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavDrawer;
