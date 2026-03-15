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
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-72 max-w-[80vw] bg-surface h-full flex flex-col shadow-2xl animate-slideInLeft border-r border-border-dim pointer-events-auto">
                <div className="flex items-center justify-between p-4 border-b border-border-dim bg-surface">
                    <h2 className="text-xl font-bold text-main">Menu</h2>
                    <button onClick={onClose} className="p-2 text-muted hover:text-main hover:bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
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
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-primary/10 text-primary font-black'
                                        : 'text-muted hover:bg-primary/5 hover:text-main'}
                                `}
                            >
                                <span className="material-symbols-outlined">{link.icon}</span>
                                <span className="font-medium">{link.label}</span>
                            </a>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border-dim">
                    <button 
                        onClick={async () => {
                            if (confirm('Apakah Anda yakin ingin keluar?')) {
                                try {
                                    const { signOut } = await import('./authClient');
                                    // 1. Better Auth official sign out
                                    await signOut();
                                    
                                    // 2. Clear our specific manual session cookie if it exists
                                    const apiUrl = import.meta.env.VITE_API_URL || 'https://aplikasi-stok-kerabat.onrender.com/api';
                                    await fetch(`${apiUrl}/auth/logout-manual`, {
                                        method: 'POST',
                                        credentials: 'include'
                                    });
                                    
                                    // 3. Final cleanup and redirect to base
                                    window.location.href = '/aplikasi-stok-kerabat/';
                                } catch (error) {
                                    console.error("Logout failed:", error);
                                    window.location.reload();
                                }
                            }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors font-bold"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes slideInLeft {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default NavDrawer;




