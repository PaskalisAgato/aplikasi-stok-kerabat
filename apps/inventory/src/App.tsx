import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import type { ApiResponse } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { db } from '@shared/services/db';
import { syncEngine } from '@shared/services/SyncEngine';

import InventoryCard from './components/InventoryCard';
import StockDetailModal from './components/StockDetailModal';
import AddStockModal from './components/AddStockModal';
import CreateItemModal from './components/CreateItemModal';
import NotificationModal from './components/NotificationModal';
import EditItemModal from './components/EditItemModal';
import StoreProfileModal from './components/StoreProfileModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ContainerManagementModal from './components/ContainerManagementModal';

export interface BahanBaku {
  id: number;
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  minStock: string;
  pricePerUnit: string;
  discountPrice: string | null;
  imageUrl: string | null;
  externalImageUrl: string | null;
  status: 'NORMAL' | 'KRITIS' | 'HABIS';
  supplier?: string;
  idealStock?: string | number;
  containerWeight: string;
  containerId: number | null;
  version: number;
}

function App() {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Debounce Hook pattern
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [selectedStock, setSelectedStock] = useState<BahanBaku | null>(null);
  const [inventoryList, setInventoryList] = useState<BahanBaku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BahanBaku | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<BahanBaku[]>([]);
  const PAGE_SIZE = 20;

  const fetchInventory = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setIsLoading(true);
        setPage(0);
      }
      setIsError(false);
      
      const currentPage = isLoadMore ? page + 1 : 0;
      const response: ApiResponse<BahanBaku> = await apiClient.getInventory(PAGE_SIZE, currentPage * PAGE_SIZE, searchQuery, filterType, filterCategory);
      const { data, meta } = response;

      if (Array.isArray(data)) {
        if (isLoadMore) {
          setInventoryList(prev => [...prev, ...data]);
          setPage(currentPage);
          setHasMore((inventoryList.length + data.length) < meta.total);
        } else {
          setInventoryList(data);
          setHasMore(data.length < meta.total);
        }
      } else {
        console.error('[Inventory] Unexpected response shape:', response);
        const raw = localStorage.getItem('inventory');
        const cached = raw ? JSON.parse(raw) : [];
        if (Array.isArray(cached)) {
          setInventoryList(cached);
          if (cached.length === 0) setIsError(true);
        }
      }
    } catch (error) {
      console.error('Failed to load inventory', error);
      const cached = await db.inventoryCache.toArray();
      if (cached.length > 0) {
        setInventoryList(cached as any);
      } else {
          setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchLowStockAlerts = async () => {
    try {
      // Fetch up to 100 items flagged as 'Kritis' (includes HABIS) from the backend
      const response = await apiClient.getInventory(100, 0, '', 'Kritis');
      if (response && Array.isArray(response.data)) {
        setLowStockItems(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch low stock alerts', error);
    }
  };

  // Persist successful inventory data to Dexie as a cache
  useEffect(() => {
    if (inventoryList.length > 0) {
      db.inventoryCache.bulkPut(inventoryList.map(item => ({
          ...item,
          updatedAt: new Date().toISOString()
      })));
    }
  }, [inventoryList]);

  useEffect(() => {
    // Phase 7: Use SyncEngine for automated pulling & recovery
    syncEngine.start();
    syncEngine.pullInventory();

    fetchInventory(false);
    fetchLowStockAlerts();

    return () => {
      syncEngine.stop();
    };
  }, [filterType, debouncedSearchQuery, filterCategory]);

  const filteredInventory = inventoryList;
  


  const handleExportExcel = async () => {
    try {
      const blob = await apiClient.exportInventoryExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Kerabat_POS_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      alert('Gagal mengekspor data.');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, item: BahanBaku) => {
    e.stopPropagation();
    setItemToDelete(item);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteInventoryItem(itemToDelete.id);
      // Immediate UI Update
      setInventoryList(prev => prev.filter(i => i.id !== itemToDelete.id));
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Failed to delete item', error);
      alert('Gagal menghapus bahan baku. Cek koneksi server.');
    } finally {
      setIsDeleting(false);
    }
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

        <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-primary text-sm font-black">category</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Kategori</p>
            </div>
            <div className="flex flex-wrap gap-2 px-2">
                {['Semua', 'Bar', 'Dapur', 'Frezer', 'Showcase', 'Lainnya'].map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.97] ${filterCategory === cat ? 'accent-gradient text-slate-950 shadow-lg shadow-primary/10' : 'text-[var(--text-muted)] hover:bg-primary/5 hover:text-primary glass border-transparent'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
        <div className="pt-10 border-t border-[var(--border-dim)] space-y-4">
            <a href="/pos/" className="w-full flex items-center justify-center gap-4 bg-emerald-500 text-slate-950 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">
                <span className="material-symbols-outlined font-black">payments</span>
                Catat Penjualan
            </a>
            <button onClick={() => setIsCreateItemModalOpen(true)} className="btn-primary w-full py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-primary/20">
                <span className="material-symbols-outlined font-black">add_circle</span>
                Bahan Baru
            </button>
            <button onClick={handleExportExcel} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl glass border-[var(--border-dim)] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all active:scale-[0.97]">
                <span className="material-symbols-outlined text-lg font-black">table_chart</span>
                Ekspor Excel
            </button>

        </div>
    </div>
  );

  const InventoryHeaderExtras = (
    <div className="flex items-center gap-4 justify-end">
        <div className="relative w-64 group hidden xl:block">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">search</span>
            <input
                type="text"
                placeholder="Cari bahan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-12 pr-6 rounded-xl glass focus:ring-4 focus:ring-primary/20 text-xs font-bold text-[var(--text-main)] shadow-inner border-none"
            />
        </div>
        <button onClick={handleExportExcel} className="size-11 glass flex items-center justify-center text-primary group shrink-0 rounded-2xl hover:bg-primary/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black group-hover:scale-110 transition-transform">table_chart</span>
        </button>
        <button onClick={() => setIsNotificationModalOpen(true)} className="size-11 glass flex items-center justify-center text-primary group shrink-0 rounded-2xl hover:bg-primary/5 active:scale-90 transition-all">
            <div className="relative">
                <span className="material-symbols-outlined font-black group-hover:scale-110 transition-transform">notifications</span>
                {lowStockItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[var(--bg-surface)] animate-pulse">
                        {lowStockItems.length}
                    </span>
                )}
            </div>
        </button>

        <button onClick={() => setIsContainerModalOpen(true)} className="size-11 glass flex items-center justify-center text-primary group shrink-0 rounded-2xl hover:bg-primary/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black group-hover:scale-110 transition-transform">database</span>
        </button>

        <a 
                href="/settings/"
                className="size-11 glass flex items-center justify-center rounded-2xl text-[var(--text-muted)] hover:bg-white/5 active:scale-90 transition-all border-white/10"
          >
              <span className="material-symbols-outlined font-black">settings</span>
        </a>
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
            className="flex-[2] flex items-center justify-center gap-4 accent-gradient text-[var(--text-main)] px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/20 active:scale-95 transition-all border-none group"
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
      subtitle="Ketersediaan Bahan Baku"
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

        {/* Mobile Category Filter Scroll */}
        <div className="lg:hidden flex gap-3 overflow-x-auto hide-scrollbar mb-4 pb-4 px-2">
            {['Semua', 'Bar', 'Dapur', 'Frezer', 'Showcase', 'Lainnya'].map(cat => (
            <button 
                key={`mob-cat-filt-${cat}`}
                onClick={() => setFilterCategory(cat)}
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border-2 ${filterCategory === cat ? 'accent-gradient text-[var(--text-main)] border-primary shadow-xl shadow-primary/30 scale-105' : 'glass text-muted border-white/5 opacity-80 hover:opacity-100 shadow-lg'}`}
            >
                {cat}
            </button>
            ))}
        </div>

        {/* Mobile Filter Scroll */}
        <div className="lg:hidden flex gap-3 overflow-x-auto hide-scrollbar mb-8 pb-4 px-2">
            {['Semua', 'Kritis', 'Normal'].map(cat => (
            <button 
                key={`mob-cat-${cat}`}
                onClick={() => setFilterType(cat)}
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border-2 ${filterType === cat ? 'accent-gradient text-[var(--text-main)] border-primary shadow-xl shadow-primary/30 scale-105' : 'glass text-muted border-white/5 opacity-80 hover:opacity-100 shadow-lg'}`}
            >
                {cat}
            </button>
            ))}
        </div>

        <div className="flex items-center justify-end mb-10 px-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="glass px-5 py-2 rounded-2xl border-white/5 shadow-inner">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-80">{filteredInventory.length} ITEM AKTIF</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
            {filteredInventory.map(item => (
                <InventoryCard 
                    key={item.id}
                    item={item}
                    onSelect={(i) => { setSelectedStock(i); setIsStockModalOpen(true); }}
                    onEdit={(i) => { setSelectedStock(i); setIsEditItemModalOpen(true); }}
                    onDelete={(i) => handleDeleteClick(null as any, i)}
                />
            ))}
        </div>

        {hasMore && !isLoading && (
            <div className="flex justify-center mt-12 pb-12">
                <button 
                    onClick={() => fetchInventory(true)}
                    className="px-10 py-4 glass border-white/10 text-primary font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-primary/5 active:scale-95 transition-all shadow-xl"
                >
                    Tampilkan Lebih Banyak
                </button>
            </div>
        )}

        {isLoading && (
            <div className="flex flex-col justify-center items-center py-24 gap-6">
            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menyelaraskan Stok...</p>
            </div>
        )}

        {!isLoading && isError && filteredInventory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 glass rounded-[3rem] border-dashed border-2 border-red-500/30 m-4 animate-in fade-in zoom-in duration-700">
                <div className="size-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-7xl text-red-500 font-black">wifi_off</span>
                </div>
                <p className="font-black text-lg uppercase tracking-widest text-red-400">Koneksi Gagal</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-[var(--text-muted)]">Tidak dapat memuat data dari server</p>
                <button
                    onClick={() => fetchInventory()}
                    className="mt-6 px-8 py-3 rounded-2xl btn-primary text-[10px] uppercase tracking-widest font-black"
                >
                    Coba Lagi
                </button>
            </div>
        )}
        
        {!isLoading && !isError && filteredInventory.length === 0 && (
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
        onClose={() => { setIsStockModalOpen(false); fetchInventory(); }}
        selectedItem={selectedStock}
        onEditClick={() => {
            setIsStockModalOpen(false);
            setIsEditItemModalOpen(true);
        }}
        onUpdateStockClick={() => {
            setIsStockModalOpen(false);
            setIsAddStockModalOpen(true);
        }}
      />
      <AddStockModal 
        isOpen={isAddStockModalOpen} 
        onClose={() => { 
            setIsAddStockModalOpen(false); 
            setSelectedStock(null);
            fetchInventory(); 
        }} 
        initialItem={selectedStock}
      />
      <CreateItemModal isOpen={isCreateItemModalOpen} onClose={() => { setIsCreateItemModalOpen(false); fetchInventory() }} />
      <EditItemModal isOpen={isEditItemModalOpen} onClose={() => setIsEditItemModalOpen(false)} onUpdated={() => fetchInventory()} item={selectedStock} />
      <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} inventory={lowStockItems} />
      <StoreProfileModal isOpen={isStoreProfileModalOpen} onClose={() => setIsStoreProfileModalOpen(false)} />
      
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || ''}
        isDeleting={isDeleting}
      />

      <ContainerManagementModal 
        isOpen={isContainerModalOpen}
        onClose={() => setIsContainerModalOpen(false)}
      />
    </Layout>
  );
}

export default App;
