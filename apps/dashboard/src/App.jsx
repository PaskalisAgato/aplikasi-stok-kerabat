import React, { useState, useEffect } from 'react';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import CriticalStock from './components/CriticalStock';
import NotificationModal from './components/NotificationModal';
import { apiClient } from '@shared/apiClient';

import NavDrawer from '@shared/NavDrawer';

function App() {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [reports, setReports] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [reportData, invData] = await Promise.all([
          apiClient.getFinanceReports(),
          apiClient.getInventory()
        ]);
        setReports(reportData);
        setInventory(invData);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const DashboardHeaderExtras = (
    <button 
        onClick={() => setIsNotifOpen(true)} 
        className="size-12 glass flex items-center justify-center text-primary group transition-all hover:bg-primary/10 rounded-2xl shrink-0 active:scale-90"
    >
        <div className="relative">
            <span className="material-symbols-outlined font-bold group-hover:scale-110 transition-transform">notifications</span>
            <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full border-2 border-[var(--bg-surface)] animate-bounce"></span>
        </div>
    </button>
  );

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-main)] antialiased min-h-screen w-full overflow-hidden font-display">
        <div className="fixed inset-0 flex flex-col max-w-[1600px] mx-auto glass border-x border-white/5 shadow-2xl overflow-hidden">
            <header className="z-50 glass border-b border-white/5 px-8 py-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                    >
                        <span className="material-symbols-outlined font-black">menu</span>
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)] uppercase leading-tight">Dasbor</h1>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 font-bold leading-tight">Ringkasan Bisnis</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {DashboardHeaderExtras}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="relative accent-glow">
                        <div className="size-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-3xl">analytics</span>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-sm font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menganalisis Data...</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Menghubungkan ke Kerabat Cloud</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <KPICards reports={reports} />
                        <SalesChart reports={reports} />
                    </div>
                    <div className="lg:col-span-4">
                        <CriticalStock inventory={inventory} />
                    </div>
                  </div>
                )}
            </main>

            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5173} />
        </div>

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  )
}

export default App;

