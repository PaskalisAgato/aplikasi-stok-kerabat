import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

import StockDetailModal from './components/StockDetailModal';
import AddStockModal from './components/AddStockModal';
import CreateItemModal from './components/CreateItemModal';
import NotificationModal from './components/NotificationModal';
import EditItemModal from './components/EditItemModal';
import StoreProfileModal from './components/StoreProfileModal';

function App() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);
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

  const InventorySidebar = (
    <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
        <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-primary text-sm font-black">filter_list</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Filter Status</p>
            </div>
            <div className="flex flex-col gap-3">
                {['Semua', 'Kritis', 'Normal'].map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setFilterType(cat)}
                        className={`w-full text-left px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.97] ${filterType === cat ? 'accent-gradient text-slate-950 shadow-xl shadow-primary/20' : 'text-[var(--text-muted)] hover:bg-primary/5 hover:text-primary glass border-transparent'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
        <div className="pt-10 border-t border-[var(--border-dim)] space-y-4">
            <button onClick={() => setIsCreateItemModalOpen(true)} className="btn-primary w-full py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-primary/20">
                <span className="material-symbols-outlined font-black">add_circle</span>
                Tambah Bahan
            </button>
            <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl glass border-[var(--border-dim)] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all active:scale-[0.97]">
                <span className="material-symbols-outlined text-lg font-black">download</span>
                Ekspor CSV
            </button>
        </div>
    </div>
  );

  const InventoryHeaderExtras = (
    <div className="flex items-center gap-4 flex-1 justify-end">
        <div className="relative flex-1 max-w-md group hidden md:block">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">search</span>
            <input
                type="text"
                placeholder="Cari bahan baku..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-6 rounded-xl glass focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-xs font-bold text-[var(--text-main)] shadow-inner border-none"
            />
        </div>
        <button onClick={() => setIsNotificationModalOpen(true)} className="size-12 glass flex items-center justify-center text-primary group shrink-0 rounded-2xl hover:bg-primary/5 active:scale-90 transition-all">
            <div className="relative">
                <span className="material-symbols-outlined font-black group-hover:scale-110 transition-transform">notifications</span>
                <span className="absolute -top-1 -right-1 size-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-surface)]"></span>
            </div>
        </button>
        <button 
                onClick={() => setIsStoreProfileModalOpen(true)}
                className="size-12 glass flex items-center justify-center rounded-2xl text-[var(--text-muted)] hover:bg-white/5 active:scale-90 transition-all border-white/10"
          >
              <span className="material-symbols-outlined font-black">settings</span>
        </button>
    </div>
  );

  const MobileFooter = (
    <footer className="glass border-t border-white/5 p-8 shrink-0 flex gap-4 lg:hidden z-50">
        <button
            onClick={() => setIsAddStockModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-4 glass text-primary px-6 py-5 rounded-[2rem] shadow-2xl transition-all active:scale-95 border-white/10 group"
        >
            <span className="material-symbols-outlined text-2xl font-black group-hover:rotate-12 transition-transform">input</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Input Stok</span>
        </button>
        <button
            onClick={() => setIsCreateItemModalOpen(true)}
            className="flex-[2] flex items-center justify-center gap-4 accent-gradient text-slate-950 px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/20 active:scale-95 transition-all border-none group"
        >
            <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">add_circle</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Bahan Baru</span>
        </button>
    </footer>
  );

  return (
    <Layout
      currentPort={5174}
      title="Inventori"
      sidebar={InventorySidebar}
      headerExtras={InventoryHeaderExtras}
      footer={MobileFooter}
    >
        {/* Compact Search for Mobile */}
        <div className="md:hidden mb-8">
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">search</span>
                <input
                    type="text"
                    placeholder="Cari bahan baku..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-14 pr-6 rounded-2xl glass focus:ring-4 focus:ring-primary/20 text-sm font-bold text-[var(--text-main)] shadow-inner border-none"
                />
            </div>
        </div>

        {/* Mobile Filter Scroll */}
        <div className="lg:hidden flex gap-3 overflow-x-auto hide-scrollbar mb-8 pb-2">
            {['Semua', 'Kritis', 'Normal'].map(cat => (
            <button 
                key={`mob-cat-${cat}`}
                onClick={() => setFilterType(cat)}
                className={`whitespace-nowrap px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${filterType === cat ? 'accent-gradient text-slate-950 shadow-lg shadow-primary/20' : 'glass text-[var(--text-muted)] border-transparent'}`}
            >
                {cat}
            </button>
            ))}
        </div>

        <div className="flex items-center justify-between mb-10 px-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Daftar Bahan</h2>
            <p className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Ketersediaan Barang</p>
            </div>
            <div className="glass px-5 py-2 rounded-2xl border-white/5 shadow-inner">
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-80">{filteredInventory.length} ITEM AKTIF</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-700">
            {filteredInventory.map(item => (
            <div 
                key={item.id} 
                onClick={() => { setSelectedStock(item); setIsStockModalOpen(true); }}
                className="card group cursor-pointer relative overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
                {/* Status Indicator */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="min-w-0 space-y-1">
                    <h3 className="font-black text-[var(--text-main)] text-xl font-display tracking-tight leading-tight uppercase group-hover:text-primary transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-2 opacity-60">
                        <span className="material-symbols-outlined text-[14px] font-black text-primary">local_shipping</span>
                        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">{item.supplier || 'Pemasok Umum'}</p>
                    </div>
                </div>
                <div className={`text-[9px] font-black px-4 py-2 rounded-xl shadow-lg border backdrop-blur-md uppercase tracking-widest ${
                    item.status === 'KRITIS' ? 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/10' :
                    item.status === 'HABIS' ? 'text-slate-500 bg-slate-500/10 border-slate-500/20' :
                    'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10'
                }`}>
                    {item.status}
                </div>
                </div>

                {/* Stock Values */}
                <div className="flex items-end justify-between mt-auto mb-6 relative z-10">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Sisa Stok</p>
                        <p className="text-3xl font-black text-[var(--text-main)] font-display tracking-tighter">
                            {item.currentStock}
                            <span className="text-xs font-black text-[var(--text-muted)] ml-2 uppercase opacity-60 font-sans tracking-widest">{item.unit}</span>
                        </p>
                    </div>
                    <div className="text-right space-y-1 glass p-2 rounded-xl border-white/5">
                        <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Ideal Prod</p>
                        <p className="text-sm font-black text-[var(--text-main)] opacity-80">{item.systemStock} {item.unit}</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--bg-app)] h-2.5 rounded-full overflow-hidden shadow-inner relative z-10 border border-white/5">
                <div className={`${item.status === 'KRITIS' ? 'bg-red-500 accent-glow shadow-red-500/40' :
                    item.status === 'HABIS' ? 'bg-slate-500' :
                    'bg-emerald-500 accent-glow shadow-emerald-500/40'
                    } h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(5, Math.min(100, (parseFloat(item.currentStock) / (parseFloat(item.minStock) * 2 || 100)) * 100))}%` }}>
                </div>
                </div>
                
                {/* Bottom Info */}
                <div className="mt-4 flex items-center justify-between relative z-10 opacity-60">
                    <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ambang Batas: {item.minStock} {item.unit}</p>
                    <span className="material-symbols-outlined text-sm font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
            </div>
            ))}
        </div>

        {isLoading && (
            <div className="flex flex-col justify-center items-center py-24 gap-6">
            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menyelaraskan Stok...</p>
            </div>
        )}
        
        {!isLoading && filteredInventory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] opacity-40 border-dashed border-2 m-4 animate-in fade-in zoom-in duration-700">
                <div className="size-24 rounded-full bg-[var(--bg-app)] flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-7xl text-primary font-black">inventory_2</span>
                </div>
                <p className="font-black text-lg uppercase tracking-widest text-[var(--text-main)]">Gudang Kosong</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Belum ada bahan baku yang terdaftar</p>
            </div>
        )}

      <StockDetailModal
        isOpen={isStockModalOpen}
        onClose={() => { setIsStockModalOpen(false); fetchInventory() }}
        selectedItem={selectedStock}
        onEditClick={() => {
            setIsStockModalOpen(false);
            setIsEditItemModalOpen(true);
        }}
      />
      <AddStockModal isOpen={isAddStockModalOpen} onClose={() => { setIsAddStockModalOpen(false); fetchInventory() }} />
      <CreateItemModal isOpen={isCreateItemModalOpen} onClose={() => { setIsCreateItemModalOpen(false); fetchInventory() }} />
      <EditItemModal isOpen={isEditItemModalOpen} onClose={() => setIsEditItemModalOpen(false)} onUpdated={() => fetchInventory()} item={selectedStock} />
      <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} inventory={inventoryList} />
      <StoreProfileModal isOpen={isStoreProfileModalOpen} onClose={() => setIsStoreProfileModalOpen(false)} />
    </Layout>
  );
}

export default App;
