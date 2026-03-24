import React, { useState, useEffect } from 'react';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import CriticalStock from './components/CriticalStock';
import SystemHealth from './components/SystemHealth';
import MaintenanceTools from './components/MaintenanceTools';
import NotificationModal from './components/NotificationModal';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

function App() {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [reports, setReports] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [reportData, invData, healthData] = await Promise.all([
          apiClient.getFinanceReports(),
          apiClient.getInventory(),
          apiClient.getSystemStats()
        ]);
        setReports(reportData?.data || reportData);
        setInventory(invData?.data || invData || []);
        setHealth(healthData?.data || healthData);
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
    <Layout
        currentPort={5173}
        title="Dasbor"
        headerExtras={DashboardHeaderExtras}
    >
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
                <div className="lg:col-span-4 space-y-10">
                    <SystemHealth health={health} />
                    <MaintenanceTools />
                    <CriticalStock inventory={inventory} />
                </div>
            </div>
        )}
        <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </Layout>
  );
}

export default App;

