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
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display min-h-screen w-full transition-colors duration-300">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5174} />
      
      <div className="flex flex-col min-h-screen lg:flex-row max-w-[1600px] mx-auto">
        
        {/* Desktop Sidebar (Filter) - Hidden on Mobile */}
        <aside className="hidden lg:flex w-72 h-screen sticky top-0 bg-surface border-r border-[var(--border-color)] flex-col p-6 space-y-8">
            <div className="flex items-center gap-3">
                 <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="text-xl font-black tracking-tight">Inventory</h1>
            </div>

            <div className="space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Filter Status</p>
                <div className="flex flex-col gap-2">
                    {['Semua', 'Kritis', 'Normal'].map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => setFilterType(cat)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${filterType === cat ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-primary/5 hover:text-primary'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-[var(--border-color)] space-y-4">
                <button onClick={() => setIsCreateItemModalOpen(true)} className="btn-primary w-full">
                    <span className="material-symbols-outlined">add</span>
                    Tambah Bahan
                </button>
                <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border-color)] text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Ekspor CSV
                </button>
            </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header (Unified Mobile/Desktop Search) */}
            <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 md:p-6 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-4">
                    <button onClick={() => setDrawerOpen(true)} className="lg:hidden size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    
                    <div className="relative flex-1 group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Cari bahan baku (kopi, gula, susu...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-[var(--border-color)] bg-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold"
                        />
                    </div>

                    <div className="flex gap-2">
                         <button onClick={() => setIsNotificationModalOpen(true)} className="size-12 card flex items-center justify-center text-primary group">
                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">notifications</span>
                        </button>
                    </div>
                </div>

                {/* Mobile-only horizontal category scroll */}
                <div className="lg:hidden flex gap-2 overflow-x-auto hide-scrollbar mt-4 pb-1">
                    {['Semua', 'Kritis', 'Normal'].map(cat => (
                        <button 
                            key={`mob-cat-${cat}`}
                            onClick={() => setFilterType(cat)}
                            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all ${filterType === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-primary/10 text-slate-500'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Daftar Inventori</h2>
                    <p className="text-xs font-bold text-slate-500">Menampilkan {filteredInventory.length} item</p>
                </div>

        {/* Inventory List */}
        <main className="flex-1 px-4 pt-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-primary/50 mb-2 px-1">Daftar Stok Bahan</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredInventory.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => { setSelectedStock(item); setIsStockModalOpen(true); }}
                      className="card p-6 flex flex-col hover:border-primary/40 active:scale-[0.98] group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight truncate px-1">{item.name}</h3>
                          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                               <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                               {item.supplier || 'No Supplier'}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm ${item.status === 'KRITIS' ? 'text-red-600 bg-red-100' :
                            item.status === 'HABIS' ? 'text-slate-600 bg-slate-200' :
                              'text-emerald-600 bg-emerald-100'
                            }`}>
                            {item.status}
                        </span>
                      </div>

                      <div className="flex items-end justify-between mt-auto mb-4">
                           <div className="flex flex-col">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Stok</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    {item.currentStock}
                                    <span className="text-xs font-bold text-slate-400 ml-1 italic">{item.unit}</span>
                                </p>
                           </div>
                           <div className="text-right flex flex-col items-end">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem</p>
                                <p className="text-sm font-bold text-slate-500">{item.systemStock}{item.unit}</p>
                           </div>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden shadow-inner">
                        <div className={`${item.status === 'KRITIS' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                          item.status === 'HABIS' ? 'bg-slate-400' :
                            'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                          } h-full rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(100, (parseFloat(item.currentStock) / (parseFloat(item.minStock) * 2 || 100)) * 100)}%` }}>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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

            {/* Mobile Floating Action Button (shown only on mobile) */}
            <div className="lg:hidden fixed bottom-6 right-6 flex flex-col items-end gap-3 z-30">
                <button
                    onClick={() => setIsAddStockModalOpen(true)}
                    className="size-14 bg-white dark:bg-slate-800 text-primary rounded-full shadow-2xl flex items-center justify-center border border-primary/10"
                >
                    <span className="material-symbols-outlined">input</span>
                </button>
                <button
                    onClick={() => setIsCreateItemModalOpen(true)}
                    className="size-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
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
