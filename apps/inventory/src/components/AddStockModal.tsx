import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

interface InventoryItem {
    id: number;
    name: string;
    unit: string;
    currentStock: string;
    imageUrl: string;
}

interface SelectedItem {
    id: string; // matches InventoryItem.id or timestamp
    inventoryId: number;
    name: string;
    unit: string;
    stock: number;
    image: string;
    quantity: number;
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
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose }) => {
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

    useEffect(() => {
        if (isOpen) {
            fetchInventory();
        }
    }, [isOpen]);

    const fetchInventory = async () => {
        try {
            const data = await apiClient.getInventory();
            setInventory(data);
        } catch (error) {
            console.error('Failed to load inventory', error);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const data = await apiClient.getStockInHistory();
            setHistoryData(data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    if (!isOpen) return null;

    const filteredInventory = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !items.some(selected => selected.inventoryId === item.id)
    );

    const handleAddItem = (item: InventoryItem) => {
        const newItem: SelectedItem = {
            id: item.id.toString(),
            inventoryId: item.id,
            name: item.name,
            unit: item.unit,
            stock: parseFloat(item.currentStock),
            image: item.imageUrl || 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop',
            quantity: 1,
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

    const handleInputChange = (id: string, field: 'price' | 'discount', value: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
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

                <div className="flex-1 overflow-y-auto pb-40">
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
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
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
                                    <div className="p-4 text-center text-slate-500 text-sm">
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
                            <div key={item.id} className="flex flex-col gap-4 bg-surface p-4 rounded-xl border border-border-dim shadow-sm relative">
                                <button 
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="absolute -top-2 -right-2 size-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                                <div className="flex gap-4 justify-between">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[64px] border border-border-dim"
                                            style={{ backgroundImage: `url("${item.image}")` }}
                                        />
                                        <div className="flex flex-1 flex-col justify-center gap-1">
                                            <h4 className="text-main text-base font-bold leading-tight">{item.name}</h4>
                                            <p className="text-muted text-xs font-normal">Satuan: {item.unit} • Stok: {item.stock} {item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="flex items-center gap-3 text-main bg-background-app p-1 rounded-full border border-border-dim">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-primary shadow-sm active:scale-95 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">remove</span>
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                                                className="text-center bg-transparent border-none focus:ring-0 p-0 font-bold text-base text-main min-w-[32px] max-w-[100px]"
                                                style={{ width: `${Math.max(2, String(item.quantity || '').length)}ch` }}
                                                min="0"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm active:scale-95 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-dim">
                                    <div className="flex flex-col flex-1">
                                        <p className="text-muted text-xs font-medium pb-1 ml-1 uppercase">Harga Beli (Rp)</p>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                                            className="w-full rounded-lg text-main focus:ring-2 focus:ring-primary/50 border border-border-dim bg-transparent h-11 px-3 text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <p className="text-muted text-xs font-medium pb-1 ml-1 uppercase">Diskon (%)</p>
                                        <input
                                            type="number"
                                            value={item.discount}
                                            onChange={(e) => handleInputChange(item.id, 'discount', e.target.value)}
                                            className="w-full rounded-lg text-main focus:ring-2 focus:ring-primary/50 border border-border-dim bg-transparent h-11 px-3 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-app/80 backdrop-blur-md border-t border-border-dim z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div className="max-w-md mx-auto space-y-3">
                        {items.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-muted mb-1 block">Nama Supplier (Opsional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ketik supplier..."
                                        value={supplierName}
                                        onChange={e => setSupplierName(e.target.value)}
                                        className="w-full text-sm h-10 rounded-xl bg-background-app border border-border-dim focus:ring-primary focus:border-primary px-3 text-main"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-muted mb-1 block">Tanggal Masuk</label>
                                    <input 
                                        type="date" 
                                        value={customDate}
                                        onChange={e => setCustomDate(e.target.value)}
                                        className="w-full text-sm h-10 rounded-xl bg-background-app border border-border-dim focus:ring-primary focus:border-primary px-3 text-main"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center px-1">
                            <span className="text-muted text-sm">Total Belanja</span>
                            <span className="text-main text-lg font-bold">
                                Rp {calculateTotal().toLocaleString('id-ID')}
                            </span>
                        </div>
                        <button 
                            onClick={handleSaveStock}
                            disabled={isSaving || items.length === 0}
                            className={`w-full ${isSaving ? 'bg-slate-400' : 'bg-primary hover:bg-primary/90'} text-white font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(200,100,20,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all`}
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined">inventory_2</span>
                            )}
                            {isSaving ? 'Menyimpan...' : 'Simpan Stok'}
                        </button>
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

