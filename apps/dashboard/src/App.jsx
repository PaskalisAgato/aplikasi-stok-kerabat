import React, { useState, useEffect } from 'react';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import CriticalStock from './components/CriticalStock';
import NotificationModal from './components/NotificationModal';
import { apiClient } from '@shared/apiClient';

import Layout from '@shared/Layout';

function App() {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [reports, setReports] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        className="size-11 card flex items-center justify-center text-primary group transition-all hover:bg-primary/5 shrink-0"
    >
        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">notifications</span>
    </button>
  );

  return (
    <Layout 
        currentPort={5173} 
        title="Dasbor" 
        headerExtras={DashboardHeaderExtras}
        maxWidth="1400px"
    >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <span className="material-symbols-outlined animate-spin text-primary text-6xl">refresh</span>
            <p className="text-sm font-black text-muted uppercase tracking-widest animate-pulse">Memuat Ringkasan...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                <KPICards reports={reports} />
                <SalesChart reports={reports} />
            </div>
            <div className="lg:col-span-4">
                <CriticalStock inventory={inventory} />
            </div>
          </div>
        )}

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </Layout>
  )
}

export default App;

