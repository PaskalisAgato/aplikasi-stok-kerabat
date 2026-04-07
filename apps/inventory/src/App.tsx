import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import type { ApiResponse } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { getOptimizedImageUrl } from '@shared/supabase';

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
      let cached: BahanBaku[] = [];
      try {
        const raw = localStorage.getItem('inventory');
        cached = raw ? JSON.parse(raw) : [];
      } catch {
        localStorage.removeItem('inventory');
      }
      setInventoryList(cached);
      if (cached.length === 0) setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Persist successful inventory data to localStorage as a cache
  useEffect(() => {
    if (inventoryList.length > 0) {
      try {
        localStorage.setItem('inventory', JSON.stringify(inventoryList));
      } catch {
        // Quota exceeded – ignore
      }
    }
  }, [inventoryList]);

  useEffect(() => {
    fetchInventory(false);
  }, [filterType, searchQuery, filterCategory]);

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
                {inventoryList.filter(i => (parseFloat(i.currentStock) <= parseFloat(i.minStock))).length > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[var(--bg-surface)] animate-pulse">
                        {inventoryList.filter(i => (parseFloat(i.currentStock) <= parseFloat(i.minStock))).length}
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
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border-2 ${filterCategory === cat ? 'accent-gradient text-slate-950 border-primary shadow-xl shadow-primary/30 scale-105' : 'glass text-muted border-white/5 opacity-80 hover:opacity-100 shadow-lg'}`}
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
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 border-2 ${filterType === cat ? 'accent-gradient text-slate-950 border-primary shadow-xl shadow-primary/30 scale-105' : 'glass text-muted border-white/5 opacity-80 hover:opacity-100 shadow-lg'}`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-700">
            {filteredInventory.map(item => (
            <div 
                key={item.id} 
                onClick={() => { setSelectedStock(item); setIsStockModalOpen(true); }}
                className={`card group cursor-pointer relative overflow-hidden transition-all duration-500 ${Number(item.currentStock) === 0 ? 'bg-red-500/[0.02] animate-pulse-slow' : ''} hover:scale-[1.02] active:scale-[0.98]`}
            >
                {/* Image and Info */}
                <div className="flex justify-between items-start mb-6 relative z-10 gap-4">
                    <div className="flex gap-4 items-start min-w-0 flex-1">
                        <div className="size-16 rounded-2xl overflow-hidden glass border border-white/10 shrink-0 bg-primary/5">
                            <img 
                                src={getOptimizedImageUrl(item.imageUrl || item.externalImageUrl || '', { width: 200, height: 200 })} 
                                alt={item.name}
                                loading="lazy"
                                className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                                }}
                            />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <h3 className="font-black text-[var(--text-main)] text-xl font-display tracking-tight leading-tight uppercase group-hover:text-primary transition-colors text-auto-fit">{item.name}</h3>
                            <div className="flex items-center gap-2 opacity-60">
                                <span className="material-symbols-outlined text-[14px] font-black text-primary">local_shipping</span>
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest text-auto-fit-sm">{item.supplier || 'Pemasok Umum'}</p>
                            </div>
                        </div>
                    </div>
                <div className="flex flex-col items-end gap-2">
                    <div className={`text-[9px] font-black px-4 py-2 rounded-xl shadow-lg border backdrop-blur-md uppercase tracking-widest ${
                        item.status === 'KRITIS' ? 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/10' :
                        item.status === 'HABIS' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                        'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10'
                    }`}>
                        {item.status}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStock(item);
                                setIsEditItemModalOpen(true);
                            }}
                            className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 active:scale-90"
                            title="Edit Data Bahan"
                        >
                            <span className="material-symbols-outlined text-sm font-black">edit</span>
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClick(e, item)}
                            className="size-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 active:scale-90"
                            title="Hapus Bahan Baku"
                        >
                            <span className="material-symbols-outlined text-sm font-black">delete</span>
                        </button>
                    </div>
                </div>
                </div>

                {/* Stock Values */}
                <div className="flex items-end justify-between mt-auto mb-6 relative z-10 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">Sisa Stok</p>
                        <p className={`text-3xl font-black font-display tracking-tighter transition-colors duration-500 ${Number(item.currentStock) === 0 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                            {Number(item.currentStock)}
                            <span className={`text-xs font-black ml-2 uppercase opacity-60 font-sans tracking-widest ${Number(item.currentStock) === 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>{item.unit}</span>
                        </p>
                    </div>
                    <div className="text-right space-y-1 glass p-2 rounded-xl border-white/5 flex flex-col justify-center">
                        <div className="flex flex-col items-end gap-0.5">
                            <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tight">KOTOR: {Number((parseFloat(item.currentStock) + parseFloat(item.containerWeight || '0')).toFixed(2))}{item.unit}</p>
                            <p className="text-[8px] font-bold text-rose-500 uppercase tracking-tight">WADAH: {Number(parseFloat(item.containerWeight || '0').toFixed(2))}{item.unit}</p>
                            <div className="h-[1px] w-8 bg-white/10 my-0.5" />
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">IDEAL: {Number(item.idealStock || 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--bg-app)] h-2.5 rounded-full overflow-hidden shadow-inner relative z-10 border border-white/5">
                <div className={`${item.status === 'KRITIS' ? 'bg-red-500 accent-glow shadow-red-500/40' :
                    item.status === 'HABIS' ? 'bg-red-500 shadow-lg shadow-red-500/40' :
                    'bg-emerald-500 accent-glow shadow-emerald-500/40'
                    } h-full rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.max(5, Math.min(100, (parseFloat(item.currentStock) / (parseFloat(item.minStock) * 2 || 100)) * 100))}%` }}>
                </div>
                </div>
                
                {/* Bottom Info */}
            </div>
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
      <NotificationModal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)} inventory={inventoryList} />
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
