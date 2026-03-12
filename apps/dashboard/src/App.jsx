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
    <div className="relative flex min-h-screen w-full flex-col max-w-[390px] mx-auto overflow-x-hidden bg-background-light dark:bg-background-dark">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5173} />
      <Header onMenuClick={() => setDrawerOpen(true)} onNotificationClick={() => setIsNotifOpen(true)} />
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
        </div>
      ) : (
        <>
          <KPICards reports={reports} />
          <SalesChart reports={reports} />
          <CriticalStock inventory={inventory} />
        </>
      )}

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  )
}

export default App;
