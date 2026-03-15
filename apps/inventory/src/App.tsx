import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

import StockDetailModal from './components/StockDetailModal';
import AddStockModal from './components/AddStockModal';
import CreateItemModal from './components/CreateItemModal';
import NotificationModal from './components/NotificationModal';
import EditItemModal from './components/EditItemModal';
import StoreProfileModal from './components/StoreProfileModal';
import EmployeeManagementModal from './components/EmployeeManagementModal';


import Layout from '@shared/Layout';

function App() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ... (fetch logic remains same)
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
    if (filterType === 'Kritis' && item.status !== 'KRITIS' && item.status !== 'HABIS') return false;
    if (filterType === 'Normal' && item.status !== 'NORMAL') return false;
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
      item.name, item.category, item.currentStock, item.unit, item.minStock, item.status, item.pricePerUnit
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = `data_stok_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sidebar Component for Layout
  const InventorySidebar = (
    <div className="space-y-8">
        <div className="space-y-4">
            <p className="text-xs font-black text-muted uppercase tracking-widest">Filter Status</p>
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
        <div className="pt-8 border-t border-border-dim space-y-4">
            <button onClick={() => setIsCreateItemModalOpen(true)} className="btn-primary w-full">
                <span className="material-symbols-outlined">add</span>
                Tambah Bahan
            </button>
            <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border-dim text-muted font-bold hover:bg-primary/5 transition-all">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Ekspor CSV
            </button>
        </div>
    </div>
  );

  // Header Extras (Search + Notifications)
  const InventoryHeaderExtras = (
    <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative flex-1 group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted">search</span>
            <input
                type="text"
                placeholder="Cari bahan baku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-12 pr-4 rounded-2xl border border-border-dim bg-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-main"
            />
        </div>
        <button onClick={() => setIsNotificationModalOpen(true)} className="size-11 card flex items-center justify-center text-primary group shrink-0">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">notifications</span>
        </button>
    </div>
  );

  return (
    <Layout 
        currentPort={5174} 
        title="Inventory" 
        sidebar={InventorySidebar}
        headerExtras={InventoryHeaderExtras}
    >
        {/* Mobile Filter Scroll */}
        <div className="lg:hidden flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-2">
            {['Semua', 'Kritis', 'Normal'].map(cat => (
                <button 
                    key={`mob-cat-${cat}`}
                    onClick={() => setFilterType(cat)}
                    className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black transition-all ${filterType === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-background-app text-muted'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="flex items-center justify-between mb-8 px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Daftar Inventori</h2>
            <p className="text-xs font-bold text-muted">Menampilkan {filteredInventory.length} item</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInventory.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setSelectedStock(item); setIsStockModalOpen(true); }}
              className="card p-6 flex flex-col hover:border-primary/40 active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="min-w-0">
                  <h3 className="font-black text-main text-lg leading-tight truncate px-1">{item.name}</h3>
                  <p className="text-xs font-bold text-muted mt-1 flex items-center gap-1">
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
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Sisa Stok</p>
                        <p className="text-2xl font-black text-main">
                            {item.currentStock}
                            <span className="text-xs font-bold text-muted ml-1 italic">{item.unit}</span>
                        </p>
                   </div>
                   <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Sistem</p>
                        <p className="text-sm font-bold text-muted">{item.systemStock}{item.unit}</p>
                   </div>
              </div>

              <div className="w-full bg-background-app h-2 rounded-full overflow-hidden shadow-inner">
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
           <div className="flex flex-col items-center justify-center py-20 text-muted opacity-50">
             <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
             <p className="font-bold">Belum ada stok bahan baku</p>
           </div>
        )}

        {/* Mobile Floating Action Button */}
        <div className="lg:hidden fixed bottom-6 right-6 flex flex-col items-end gap-3 z-30">
            <button
                onClick={() => setIsAddStockModalOpen(true)}
                className="size-14 bg-surface text-primary rounded-full shadow-2xl flex items-center justify-center border border-border-dim"
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

      <StockDetailModal
        isOpen={isStockModalOpen}
        onClose={() => { setIsStockModalOpen(false); fetchInventory() }}
        selectedItem={selectedStock}
        onEditClick={() => {
            setIsStockModalOpen(false);
            setIsEditItemModalOpen(true);
        }}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => { setIsAddStockModalOpen(false); fetchInventory() }}
      />

      <CreateItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => { setIsCreateItemModalOpen(false); fetchInventory() }}
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

    </Layout>
  );
}

export default App;

