import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import type { ApiResponse } from '@shared/apiClient';
import type { BahanBaku as InventoryItem } from '../App';

interface SelectedItem {
    id: string; // matches InventoryItem.id or timestamp
    inventoryId: number;
    name: string;
    unit: string;
    stock: number;
    containerWeight: number;
    image: string;
    quantity: number;
    grossWeight: string;
    price: string;
    discount: string;
}

interface HistoryItem {
    id: number;
    inventoryName: string;
    quantity: string;
    unit: string;
    supplierName: string | null;
    reason: string | null;
    createdAt: string;
}

interface AddStockModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialItem?: InventoryItem | null;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, initialItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Global inputs for this restock batch
    const [supplierName, setSupplierName] = useState('');
    const [customDate, setCustomDate] = useState(new Date().toISOString().substring(0, 10));

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const controllerRef = React.useRef<AbortController | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setItems([]);
            setSearchTerm('');
            setSupplierName('');
            setInventory([]);
            return;
        }

        if (initialItem) {
            handleAddItem(initialItem);
        }
    }, [isOpen, initialItem]);

    // Debounced search effect
    useEffect(() => {
        if (!isOpen) return;
        
        // If search term is empty or too short, clear results
        if (!searchTerm || searchTerm.length < 2) {
            setInventory([]);
            return;
        }

        const timeout = setTimeout(() => {
            fetchInventory();
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, isOpen]);

    const fetchInventory = async () => {
        // Cancel previous request
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const response: ApiResponse<InventoryItem> = await apiClient.getInventory(20, 0, searchTerm, '', '', '', controller.signal);
            setInventory(response.data);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Failed to load inventory', error);
            }
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await apiClient.getStockInHistory();
            setHistoryData(data.data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    if (!isOpen) return null;

    const filteredInventory = inventory.filter(item => 
        !items.some(selected => selected.inventoryId === item.id)
    );

    const handleAddItem = (item: InventoryItem) => {
        const newItem: SelectedItem = {
            id: item.id.toString(),
            inventoryId: item.id,
            name: item.name,
            unit: item.unit,
            stock: parseFloat(item.currentStock),
            containerWeight: parseFloat(item.containerWeight || '0'),
            image: item.externalImageUrl || '',
            quantity: 1,
            grossWeight: '',
            price: '',
            discount: ''
        };
        setItems(prev => [...prev, newItem]);
        setSearchTerm('');
        setIsSearching(false);
    };

    const handleQuantityChange = (id: string, delta: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ));
    };

    const handleQuantityInput = (id: string, value: string) => {
        const num = parseFloat(value);
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: isNaN(num) ? 0 : Math.max(0, num) } : item
        ));
    };

    const handleInputChange = (id: string, field: 'price' | 'discount' | 'grossWeight', value: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'grossWeight' && value) {
                    const gross = parseFloat(value) || 0;
                    updated.quantity = Math.max(0, gross - item.containerWeight);
                }
                return updated;
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const price = parseFloat(item.price) || 0;
            const discount = parseFloat(item.discount) || 0;
            
            const itemTotal = item.quantity * price;
            const discounted = itemTotal * (1 - discount / 100);
            return acc + discounted;
        }, 0);
    };

    const handleSaveStock = async () => {
        if (items.length === 0) {
            alert('Pilih setidaknya satu bahan untuk direstock.');
            return;
        }

        setIsSaving(true);
        try {
            for (const item of items) {
                if (item.quantity > 0) {
                    await apiClient.recordStockMovement(item.inventoryId, {
                        type: 'IN',
                        quantity: item.quantity,
                        grossWeight: item.grossWeight || undefined,
                        tareWeight: item.containerWeight || undefined,
                        reason: `Manual Restock${item.price ? ` - Rp${item.price}` : ''}`,
                        supplierName: supplierName || undefined,
                        createdAt: customDate
                    });
                }
            }
            alert('Berhasil menyimpan data stok ke Server!');
            setItems([]);
            onClose();
        } catch (error) {
            console.error('Save failed', error);
            alert('Gagal merekam data restok: ' + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-full bg-background-app rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-border-dim">
                <header className="flex items-center p-4 border-b border-border-dim">
                    <button onClick={onClose} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-main text-lg font-bold flex-1 ml-2">Update Stok Masuk</h2>
                    <button 
                        onClick={() => { setShowHistory(true); fetchHistory(); }}
                        className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
                        title="Lihat Riwayat Barang Masuk"
                    >
                        <span className="material-symbols-outlined">history</span>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto pb-[420px]">
                    <div className="px-4 py-4 relative">
                        <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm bg-background-app border border-border-dim">
                            <div className="text-primary/70 flex items-center justify-center pl-4">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="w-full bg-transparent border-none focus:ring-0 text-main placeholder:text-muted px-4 pl-2 text-base"
                                placeholder="Cari bahan baku..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsSearching(true);
                                }}
                                onFocus={() => setIsSearching(true)}
                            />
                        </div>

                        {isSearching && searchTerm.length > 0 && (
                            <div className="absolute left-4 right-4 top-16 bg-surface rounded-xl shadow-xl border border-border-dim z-30 max-h-60 overflow-y-auto">
                                {filteredInventory.length > 0 ? (
                                    filteredInventory.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => handleAddItem(item)}
                                            className="p-3 hover:bg-primary/10 flex items-center gap-3 cursor-pointer border-b border-border-dim last:border-0"
                                        >
                                            <div className="size-10 rounded bg-slate-100  flex items-center justify-center overflow-hidden">
                                                {item.externalImageUrl ? (
                                                    <img src={item.externalImageUrl} alt={item.name} className="size-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-primary/40">inventory_2</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-main">{item.name}</p>
                                                <p className="text-[10px] text-muted uppercase tracking-wider">{item.currentStock} {item.unit} Tersedia</p>
                                            </div>
                                            <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-[var(--text-muted)] text-sm">
                                        Tidak ada bahan ditemukan
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="px-4 py-2 flex justify-between items-center">
                        <h3 className="text-main text-lg font-bold">Bahan Terpilih</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-full uppercase tracking-wider">{items.length} Items</span>
                    </div>

                    <div className="space-y-3 px-4 py-2">
                        {items.length === 0 && (
                            <div className="py-10 text-center text-muted">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">inventory_2</span>
                                <p className="text-sm">Belum ada bahan terpilih.<br/>Gunakan kolom cari di atas.</p>
                            </div>
                        )}
                        {items.map(item => (
                            <div key={item.id} className="flex flex-col gap-6 bg-surface p-5 rounded-[2rem] border border-border-dim shadow-sm relative overflow-hidden group">
                                {/* Top Section: Info & Delete */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-16 border border-border-dim shrink-0 shadow-sm"
                                            style={{ backgroundImage: `url("${item.image}")` }}
                                        />
                                        <div className="flex flex-col justify-center gap-1 min-w-0 flex-1">
                                            <h4 className="text-main text-base font-black leading-tight truncate">{item.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-muted text-[10px] font-bold uppercase tracking-wider opacity-70">Stok: {item.stock} {item.unit}</p>
                                                {item.containerWeight > 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-tight border border-rose-500/20 shadow-sm">WDH: {item.containerWeight}g</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl shadow-sm active:scale-95 transition-all flex-shrink-0 border border-red-100 group hover:bg-red-600 hover:text-white z-20"
                                        title="Hapus dari daftar"
                                    >
                                        <span className="material-symbols-outlined text-[18px] font-bold">delete</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Hapus</span>
                                    </button>
                                </div>

                                    {/* Middle Section: Weight Calculation */}
                                    {item.containerWeight > 0 && (
                                        <div className="flex flex-col gap-3 p-4 bg-background-app/50 rounded-3xl border border-border-dim/50 shadow-inner">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Kalkulasi Berat (g)</span>
                                                <span className="text-[10px] font-bold text-muted uppercase">Bersih = Kotor - {item.containerWeight}g</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-muted uppercase ml-2 opacity-60">Berat Kotor (Input)</p>
                                                    <input 
                                                        type="number"
                                                        value={item.grossWeight}
                                                        onChange={(e) => handleInputChange(item.id, 'grossWeight', e.target.value)}
                                                        placeholder="Timbang Total..."
                                                        className="w-full h-12 rounded-2xl bg-white border-2 border-emerald-500/20 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-center font-black text-emerald-600 text-sm transition-all shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-muted uppercase ml-2 text-right opacity-60">Hasil Bersih (Auto)</p>
                                                    <div className="w-full h-12 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-inner">
                                                        {item.quantity} {item.unit}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-6">
                                    {/* Middle Section: Qty */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="w-full sm:w-auto flex justify-center flex-1">
                                            <div className="flex items-center gap-2 text-main bg-background-app p-1.5 rounded-2xl border border-border-dim shadow-inner w-full sm:w-auto justify-between sm:justify-start">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, -1)}
                                                    className="size-10 flex items-center justify-center rounded-xl bg-surface text-primary shadow-sm active:scale-90 transition-all border border-border-dim/50"
                                                >
                                                    <span className="material-symbols-outlined text-base font-black">remove</span>
                                                </button>
                                                <div className="flex flex-col items-center px-4">
                                                    <input
                                                        type="number"
                                                        value={item.quantity || ''}
                                                        onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                                                        className="text-center bg-transparent border-none focus:ring-0 p-0 font-black text-xl text-main w-12"
                                                        min="0"
                                                    />
                                                    <span className="text-[8px] font-black text-muted uppercase tracking-widest">{item.unit}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, 1)}
                                                    className="size-10 flex items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 active:scale-90 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-base font-black">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Section: Inputs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-dim/30">
                                        <div className="space-y-1.5">
                                            <label className="text-muted text-[10px] font-black uppercase tracking-[0.2em] ml-1">Harga Beli (Rp)</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xs font-bold group-focus-within:text-primary transition-colors">Rp</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full rounded-xl text-main font-bold focus:ring-4 focus:ring-primary/10 border border-border-dim bg-background-app/30 h-12 pl-10 pr-4 text-sm transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-muted text-[10px] font-black uppercase tracking-[0.2em] ml-1">Diskon (%)</label>
                                            <div className="relative group">
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-xs font-bold group-focus-within:text-primary transition-colors">%</span>
                                                <input
                                                    type="number"
                                                    value={item.discount}
                                                    onChange={(e) => handleInputChange(item.id, 'discount', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full rounded-xl text-main font-bold focus:ring-4 focus:ring-primary/10 border border-border-dim bg-background-app/30 h-12 px-4 text-sm transition-all text-right pr-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-app/90 backdrop-blur-lg border-t border-border-dim z-20 shadow-[0_-15px_50px_rgba(0,0,0,0.1)]">
                    <div className="max-w-md mx-auto space-y-5">
                        {items.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-primary text-xs font-black">info</span>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Informasi Tambahan</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-muted ml-1 block opacity-70">Nama Supplier</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ketik supplier..."
                                            value={supplierName}
                                            onChange={e => setSupplierName(e.target.value)}
                                            className="w-full text-sm h-12 rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary px-4 text-main font-medium transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-muted ml-1 block opacity-70">Tanggal Masuk</label>
                                        <input 
                                            type="date" 
                                            value={customDate}
                                            onChange={e => setCustomDate(e.target.value)}
                                            className="w-full text-sm h-12 rounded-xl bg-background-app border border-border-dim focus:ring-4 focus:ring-primary/10 focus:border-primary px-4 text-main font-medium transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-2 border-t border-border-dim/30">
                            <div className="flex justify-between items-center px-1 mb-4">
                                <span className="text-muted text-xs font-black uppercase tracking-widest">Total Belanja</span>
                                <span className="text-primary text-2xl font-black font-display">
                                    Rp {calculateTotal().toLocaleString('id-ID')}
                                </span>
                            </div>
                            <button 
                                onClick={handleSaveStock}
                                disabled={isSaving || items.length === 0}
                                className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-primary hover:bg-primary/90'} text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all h-14`}
                            >
                                {isSaving ? (
                                    <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined text-xl">inventory_2</span>
                                )}
                                <span className="uppercase tracking-[0.2em] text-xs">{isSaving ? 'Menyimpan...' : 'Simpan Stok Masuk'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* HISTORY PANEL OVERLAY */}
            {showHistory && (
                <div className="absolute inset-0 z-50 bg-background-app flex flex-col">
                    <header className="flex items-center p-4 border-b border-border-dim sticky top-0 bg-background-app z-10">
                        <button onClick={() => setShowHistory(false)} className="text-muted flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <h2 className="text-main text-lg font-bold flex-1 ml-2">Riwayat Barang Masuk</h2>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {isLoadingHistory ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted">
                                <span className="material-symbols-outlined animate-spin text-4xl mb-2">refresh</span>
                                <p>Memuat riwayat...</p>
                            </div>
                        ) : historyData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-30">history_toggle_off</span>
                                <p>Belum ada riwayat barang masuk.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-6">
                                {historyData.map(record => {
                                    const dateObj = new Date(record.createdAt);
                                    const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                    const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                                    
                                    return (
                                        <div key={record.id} className="bg-surface p-4 rounded-xl border border-border-dim shadow-sm flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-main">{record.inventoryName}</h4>
                                                <div className="text-right">
                                                    <span className="text-xs text-muted block">{dateStr}</span>
                                                    <span className="text-[10px] text-muted block">{timeStr}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-primary font-bold tracking-wider">Jumlah Restok</span>
                                                    <span className="text-lg font-black text-main">+{parseFloat(record.quantity)} {record.unit}</span>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    {record.supplierName && (
                                                        <span className="text-xs font-semibold bg-background-app text-muted px-2 py-0.5 rounded flex items-center gap-1 mb-1 border border-border-dim">
                                                            <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                                                            {record.supplierName}
                                                        </span>
                                                    )}
                                                    {record.reason && record.reason.includes('Rp') && (
                                                        <span className="text-xs font-medium text-muted">
                                                            {record.reason.split(' - ')[1]}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddStockModal;

