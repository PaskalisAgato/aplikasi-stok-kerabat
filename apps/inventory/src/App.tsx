import { useState } from 'react';
import { INVENTORY } from '@shared/mockDatabase';

import StockDetailModal from './components/StockDetailModal';
import AddStockModal from './components/AddStockModal';
import NotificationModal from './components/NotificationModal';
import StoreProfileModal from './components/StoreProfileModal';
import EmployeeManagementModal from './components/EmployeeManagementModal';

import NavDrawer from '@shared/NavDrawer';




function App() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterType, setFilterType] = useState('Semua');
  const [selectedStock, setSelectedStock] = useState<any>(null);

  const filteredInventory = INVENTORY.filter(item => {
    if (filterType === 'Kritis') return item.status === 'KRITIS' || item.status === 'HABIS';
    if (filterType === 'Normal') return item.status === 'NORMAL';
    return true; // Semua
  });

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display min-h-screen">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5174} />
      {/* Main Container */}
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] flex flex-col bg-background-light dark:bg-background-dark overflow-hidden pb-8">

        {/* Header Section */}
        <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md pt-6 pb-2 px-4 border-b border-slate-200 dark:border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerOpen(true)}
                className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-primary/10 hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors text-primary active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Inventory Stok</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-primary/10 hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors"
                title="Notifikasi"
              >
                <span className="material-symbols-outlined text-primary">notifications</span>
              </button>
              <button
                onClick={() => setIsStoreProfileModalOpen(true)}
                className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-primary/10 hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors"
                title="Profil Toko"
              >
                <span className="material-symbols-outlined text-primary">account_circle</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 dark:text-primary/40 text-[20px]">search</span>
            </div>
            <input
              className="w-full bg-slate-100 dark:bg-primary/10 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-primary/40"
              placeholder="Cari bahan baku..."
              type="text"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            <button 
              onClick={() => setFilterType('Semua')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold ${filterType === 'Semua' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-primary/70 border border-transparent dark:border-primary/20'}`}>Semua</button>
            <button 
              onClick={() => setFilterType('Kritis')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold ${filterType === 'Kritis' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-primary/70 border border-transparent dark:border-primary/20'}`}>Kritis</button>
            <button 
              onClick={() => setFilterType('Normal')}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold ${filterType === 'Normal' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-primary/70 border border-transparent dark:border-primary/20'}`}>Normal</button>
          </div>
        </header>

        {/* Inventory List */}
        <main className="flex-1 px-4 pt-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-primary/50 mb-2 px-1">Daftar Stok Bahan</h2>

          {filteredInventory.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setSelectedStock(item); setIsStockModalOpen(true); }}
              className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-4 shadow-sm cursor-pointer hover:border-primary/40 transition-colors active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{item.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-primary/60">Supplier: {item.supplier}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'KRITIS' ? 'text-red-500 bg-red-500/10' :
                    item.status === 'HABIS' ? 'text-slate-500 bg-slate-500/10' :
                      'text-emerald-500 bg-emerald-500/10'
                    }`}>
                    {item.status === 'KRITIS' ? 'KRITIS' : item.status === 'HABIS' ? 'HABIS' : 'NORMAL'}
                  </span>
                  <p className="text-sm font-bold mt-1">
                    {item.currentStock}{item.unit} <span className="text-slate-400 dark:text-primary/40 font-normal">/ {item.systemStock}{item.unit}</span>
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-primary/10 h-2.5 rounded-full overflow-hidden">
                <div className={`${item.status === 'KRITIS' ? 'bg-red-500' :
                  item.status === 'HABIS' ? 'bg-slate-500' :
                    'bg-emerald-500'
                  } h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, (item.currentStock / item.systemStock) * 100)}%` }}>
                </div>
              </div>
            </div>
          ))}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => setIsAddStockModalOpen(true)}
          className="fixed bottom-6 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-30"
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>

      </div>

      <StockDetailModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        selectedItem={selectedStock}
        onEditClick={() => {
            // TODO: Implement actual Edit Stock logic
            alert('Fitur ubah data stok akan segera hadir.');
        }}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <StoreProfileModal
        isOpen={isStoreProfileModalOpen}
        onClose={() => setIsStoreProfileModalOpen(false)}
      />

      <EmployeeManagementModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
      />
    </div>
  );
}

export default App;
