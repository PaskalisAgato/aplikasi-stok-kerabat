import React from 'react';
import { NAV_LINKS, getTargetUrl } from './navigation';
import { useSession } from './authClient';

interface NavDrawerProps {
    open: boolean;
    onClose: () => void;
    currentPort?: number;
}

const NavDrawer: React.FC<NavDrawerProps> = ({ open, onClose, currentPort }) => {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'Karyawan';

    if (!open) return null;

    // Filter links based on role
    const filteredLinks = NAV_LINKS.filter(link => {
        if (userRole === 'Admin') return true; // Admin sees everything
        return link.requiredRole === 'Karyawan'; // Karyawan only sees Karyawan-level links
    });

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
                <div className="flex items-center justify-between p-8">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl accent-gradient flex items-center justify-center text-slate-950 shadow-lg">
                            <span className="material-symbols-outlined font-black">coffee</span>
                        </div>
                        <h2 className="text-xl font-black font-display tracking-tight">Main Menu</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="size-10 flex items-center justify-center text-[var(--text-muted)] hover:text-primary hover:bg-primary/10 rounded-2xl transition-all"
                    >
                        <span className="material-symbols-outlined font-bold">close</span>
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
                                    }
                                }}
                                className={`
                                    flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 group
                                    ${isActive
                                        ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/30 accent-glow translate-x-1'
                                        : 'text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] hover:translate-x-1'}
                                `}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'font-black' : 'group-hover:text-primary transition-colors'}`}>
                                    {link.icon}
                                </span>
                                <span className={`font-semibold tracking-wide ${isActive ? 'text-slate-950' : ''}`}>
                                    {link.label}
                                </span>
                            </a>
                        );
                    })}
                </nav>

                <div className="p-8 mt-auto">
                    <div className="glass rounded-[2rem] p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined font-bold">account_circle</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black truncate">{session?.user?.name || 'User'}</p>
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{userRole}</p>
                            </div>
                        </div>
                        
                        <div className="h-px bg-[var(--border-dim)] my-1"></div>

                        <button 
                            onClick={async () => {
                                if (confirm('Apakah Anda yakin ingin keluar?')) {
                                    try {
                                        const { signOut } = await import('./authClient');
                                        await signOut();
                                        const apiUrl = import.meta.env.VITE_API_URL || 'https://aplikasi-stok-kerabat.onrender.com/api';
                                        await fetch(`${apiUrl}/auth/logout-manual`, {
                                            method: 'POST',
                                            credentials: 'include'
                                        });
                                        localStorage.removeItem('kerabat_auth_token');
                                        window.location.href = '/aplikasi-stok-kerabat/';
                                    } catch (error) {
                                        console.error("Logout failed:", error);
                                        window.location.reload();
                                    }
                                }
                            }}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-black"
                        >
                            <span className="material-symbols-outlined font-black">logout</span>
                            <span className="tracking-wide">Keluar Sistem</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavDrawer;





