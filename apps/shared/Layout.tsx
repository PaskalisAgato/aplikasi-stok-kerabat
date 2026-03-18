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
    const { data: session, isPending, refetch } = useSession();

    // Secondary check for manual token to avoid flicking to login on Safari
    const hasManualToken = typeof window !== 'undefined' && !!localStorage.getItem('kerabat_auth_token');

    // If we have a token but no session, try to refetch once
    React.useEffect(() => {
        if (!isPending && !session && hasManualToken) {
            console.log("Session null but token exists, refetching...");
            refetch();
        }
    }, [session, isPending, hasManualToken, refetch]);

    if (isPending) {
        return (
            <div className="min-h-screen bg-background-app flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Memeriksa Sesi...</p>
                </div>
            </div>
        );
    }

    if (!session && !hasManualToken) {
        return <AuthPage />;
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
