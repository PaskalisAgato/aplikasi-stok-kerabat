import React, { useState } from 'react';
import Header from './components/Header';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import CriticalStock from './components/CriticalStock';
import NotificationModal from './components/NotificationModal';

import NavDrawer from '@shared/NavDrawer';




function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[390px] mx-auto overflow-x-hidden">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5173} />
      <Header onMenuClick={() => setDrawerOpen(true)} onNotificationClick={() => setIsNotifOpen(true)} />
      <KPICards />
      <SalesChart />
      <CriticalStock />

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  )
}

export default App;
