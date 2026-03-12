import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

import StockDetailModal from './components/StockDetailModal';
import AddStockModal from './components/AddStockModal';
import CreateItemModal from './components/CreateItemModal';
import NotificationModal from './components/NotificationModal';
import EditItemModal from './components/EditItemModal';
import StoreProfileModal from './components/StoreProfileModal';
import EmployeeManagementModal from './components/EmployeeManagementModal';

import NavDrawer from '@shared/NavDrawer';




function App() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterType, setFilterType] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getInventory();
      setInventoryList(data);
    } catch (error) {
      console.error('Failed to load inventory', error);
      alert('Koneksi ke server gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventoryList.filter(item => {
    // Status filter
    if (filterType === 'Kritis' && item.status !== 'KRITIS' && item.status !== 'HABIS') return false;
    if (filterType === 'Normal' && item.status !== 'NORMAL') return false;
    
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const handleExportCSV = () => {
    if (inventoryList.length === 0) {
      alert('Tidak ada data yang bisa diekspor');
      return;
    }
    
    const headers = ['Nama Bahan', 'Kategori', 'Stok Saat Ini', 'Satuan', 'Min Stok', 'Status', 'Harga Beli per Unit (Rp)'];
    const rows = inventoryList.map(item => [
      item.name,
      item.category,
      item.currentStock,
      item.unit,
      item.minStock,
      item.status,
      item.pricePerUnit
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const fileName = `data_stok_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (navigator.share) {
      try {
        const file = new File([blob], fileName, { type: 'text/csv' });
        navigator.share({
          title: 'Data Stok Inventory',
          files: [file]
        }).catch(err => console.log('Share error:', err));
      } catch (err) {
        console.log('Share API not supporting files or other error', err);
      }
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display min-h-screen w-full">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5174} />
      {/* Main Container */}
      <div className="relative mx-auto min-h-screen w-full max-w-[390px] flex flex-col bg-background-light dark:bg-background-dark pb-32">

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
                onClick={handleExportCSV}
                className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-primary/10 hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors"
                title="Ekspor ke Spreadsheet"
              >
                <span className="material-symbols-outlined text-primary">download</span>
              </button>
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-primary/10 hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors"
                title="Notifikasi"
              >
                <span className="material-symbols-outlined text-primary">notifications</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 dark:text-primary/40 text-[20px]">search</span>
            </div>
            <input
              className="w-full bg-slate-100 dark:bg-primary/10 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-primary/40 text-slate-900 dark:text-slate-100"
              placeholder="Cari bahan baku..."
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
                  style={{ width: `${Math.min(100, (parseFloat(item.currentStock) / 100) * 100)}%` }}>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
            </div>
          )}
          
          {!isLoading && filteredInventory.length === 0 && (
             <div className="text-center py-10 text-slate-500">
               <p>Belum ada stok bahan baku</p>
             </div>
          )}
        </main>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-30">
          <button
            onClick={() => setIsAddStockModalOpen(true)}
            className="h-12 px-5 bg-white dark:bg-primary/20 text-primary border border-slate-200 dark:border-primary/30 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 text-sm font-bold"
            title="Restok Bahan (Ubah Kuantitas)"
          >
            <span className="material-symbols-outlined text-[20px]">input</span>
            Barang Masuk (Restok)
          </button>
          
          <button
            onClick={() => setIsCreateItemModalOpen(true)}
            className="h-14 px-6 bg-primary text-white rounded-full shadow-[0_8px_24px_rgba(200,100,20,0.3)] flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 text-base font-bold"
            title="Tambah Bahan Baru"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
            Bahan Baku Baru
          </button>
        </div>

      </div>

      <StockDetailModal
        isOpen={isStockModalOpen}
        onClose={() => { setIsStockModalOpen(false); fetchInventory() /* Refresh on close */ }}
        selectedItem={selectedStock}
        onEditClick={() => {
            setIsStockModalOpen(false);
            setIsEditItemModalOpen(true);
        }}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => { setIsAddStockModalOpen(false); fetchInventory() /* Refresh on close */ }}
      />

      <CreateItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => { setIsCreateItemModalOpen(false); fetchInventory() /* Refresh on close */ }}
      />

      <EditItemModal
        isOpen={isEditItemModalOpen}
        onClose={() => setIsEditItemModalOpen(false)}
        onUpdated={() => fetchInventory()}
        item={selectedStock}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        inventory={inventoryList}
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
