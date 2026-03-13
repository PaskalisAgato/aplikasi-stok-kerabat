import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import CriticalStock from './components/CriticalStock';
import NotificationModal from './components/NotificationModal';
import NavDrawer from '@shared/NavDrawer';
import { apiClient } from '@shared/apiClient';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-app font-display antialiased transition-colors duration-300">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5173} />
      <Header onMenuClick={() => setDrawerOpen(true)} onNotificationClick={() => setIsNotifOpen(true)} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">refresh</span>
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
      </main>

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  )
}

export default App;

