import { useState } from 'react';
import NavDrawer from '@shared/NavDrawer';
import EmployeeManagementModal from '@shared/components/EmployeeManagementModal';
import QueryProvider from '@shared/QueryProvider';

function AppContent() {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <div className="bg-background-app font-display text-main min-h-screen flex flex-col antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5178} />
            
            {/* The EmployeeManagementModal already acts as a full-page view in this context */}
            <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-20 bg-background-app/80 backdrop-blur-md border-b border-border-dim px-4 py-4 flex items-center gap-2">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-95 shrink-0"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black tracking-tight uppercase">Kelola Karyawan</h1>
                    </div>
                </header>

                <main className="flex-1 relative">
                    {/* We reuse the modal's content but forcing it to be 'open' and without its own internal header if needed, 
                        but for now, the modal's internal design works well as a view. 
                        Actually, let's just render the modal content directly or use the modal itself.
                    */}
                    <EmployeeManagementModal 
                        isOpen={true} 
                        onClose={() => setDrawerOpen(true)} 
                    />
                </main>
            </div>
            
            <style>{`
                /* Hide the modal's internal back button since we have the menu button */
                header .material-symbols-outlined:contains('arrow_back') {
                    display: none;
                }
            `}</style>
        </div>
    );
}

function App() {
    return (
        <QueryProvider>
            <AppContent />
        </QueryProvider>
    );
}

export default App;

