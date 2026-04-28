import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

const WASTE_REASONS = [
    { id: 'Expired', label: 'Kadaluwarsa / Basi', icon: 'timer_off' },
    { id: 'Spillage', label: 'Tumpah / Rusak', icon: 'water_drop' },
    { id: 'Burnt', label: 'Salah Masak / Gosong', icon: 'local_fire_department' },
    { id: 'Quality Reject', label: 'Kualitas Buruk', icon: 'thumb_down' },
    { id: 'Other', label: 'Lainnya', icon: 'category' },
];

interface LogWasteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export default function LogWasteModal({ isOpen, onClose, onSaved }: LogWasteModalProps) {
    const [inventoryList, setInventoryList] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Expired');
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const controllerRef = React.useRef<AbortController | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setInventoryList([]);
            setSelectedItem(null);
            setQuantity('');
            setSearchTerm('');
            return;
        }
    }, [isOpen]);

    // Debounced search effect
    useEffect(() => {
        if (!isOpen) return;
        
        if (!searchTerm || searchTerm.length < 2) {
            setInventoryList([]);
            return;
        }

        const timeout = setTimeout(() => {
            fetchInventory();
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchTerm, isOpen]);

    const fetchInventory = async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            const res = await apiClient.getInventory(20, 0, searchTerm, '', '', controller.signal);
            setInventoryList(res.data);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Failed to load inventory', error);
            }
        }
    };

    if (!isOpen) return null;

    const filteredInventory = inventoryList;

    const handleSubmit = async () => {
        if (!selectedItem || !quantity || parseFloat(quantity) <= 0) {
            alert('Pilih bahan dan masukkan jumlah yang valid.');
            return;
        }
        setIsSaving(true);
        try {
            await apiClient.recordStockMovement(selectedItem.id, {
                type: 'WASTE',
                quantity: parseFloat(quantity),
                reason
            });
            alert(`Waste untuk ${selectedItem.name} (${quantity} ${selectedItem.unit}) berhasil dicatat!`);
            setSelectedItem(null);
            setQuantity('');
            setReason('Expired');
            setSearchTerm('');
            onSaved();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Gagal mencatat waste. Coba lagi.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-md transition-all duration-500">
            <div className="w-full bg-[#121212] rounded-t-[3rem] shadow-2xl flex flex-col max-h-[94vh] border-t border-white/5 animate-in slide-in-from-bottom duration-500">
                {/* Drag Handle */}
                <div className="flex h-8 w-full items-center justify-center flex-shrink-0">
                    <div className="h-1.5 w-16 rounded-full bg-white/10" />
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-[var(--text-main)] font-display tracking-tight uppercase">Catat Waste</h2>
                            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">Log barang rusak atau terbuang</p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-[var(--text-main)] hover:bg-white/10 transition-all border border-white/5 shadow-inner">
                            <span className="material-symbols-outlined font-black">close</span>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Step 1: Select Item */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">TAHAP 1</span>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">Pilih Bahan Baku</label>
                            </div>
                            
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[20px] font-black">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Cari bahan persediaan..."
                                    className="w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base font-bold text-[var(--text-main)] placeholder:text-white/20 transition-all"
                                />
                            </div>

                            <div className="max-h-52 overflow-y-auto space-y-2 rounded-[2rem] border border-white/5 p-2 bg-white/5 backdrop-blur-xl shadow-inner custom-scrollbar">
                                {searchTerm.length >= 2 && filteredInventory.length === 0 ? (
                                    <div className="py-10 text-center opacity-40">
                                        <p className="text-[9px] font-black uppercase tracking-widest italic">Tidak ditemukan...</p>
                                    </div>
                                ) : filteredInventory.length > 0 ? (
                                    filteredInventory.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`w-full text-left px-4 py-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${selectedItem?.id === item.id
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[0.98]'
                                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-main)] border border-white/5'
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-black text-sm uppercase tracking-tight">{item.name}</span>
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${selectedItem?.id === item.id ? 'text-white/70' : 'text-primary'}`}>
                                                    {item.category || 'INVENTORY'}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest opacity-80`}>
                                                {item.currentStock} {item.unit}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-10 text-center opacity-20">
                                        <span className="material-symbols-outlined text-4xl mb-2 font-black">inventory_2</span>
                                        <p className="text-[9px] font-black uppercase tracking-widest">Ketik minimal 2 huruf</p>
                                    </div>
                                )}
                            </div>
                            
                            {selectedItem && (
                                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl animate-in zoom-in duration-300">
                                    <span className="material-symbols-outlined text-emerald-500 font-black">check_circle</span>
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Dipilih: {selectedItem.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Quantity */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">TAHAP 2</span>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">
                                    Jumlah Terbuang {selectedItem && `(${selectedItem.unit})`}
                                </label>
                            </div>
                            <input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="0.00"
                                min="0.01"
                                step="0.01"
                                className="w-full py-6 px-6 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none text-4xl font-black text-center text-primary font-display tracking-tighter transition-all"
                            />
                        </div>

                        {/* Step 3: Reason */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">TAHAP 3</span>
                                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-60">Alasan Pemborosan</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {WASTE_REASONS.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setReason(r.id)}
                                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${reason === r.id
                                            ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                            : 'bg-white/5 border-white/5 text-[var(--text-muted)] hover:border-red-500/50'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-2xl font-black transition-transform duration-500 ${reason === r.id ? 'scale-110' : 'group-hover:rotate-12'}`}>{r.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{r.label}</span>
                                        
                                        {reason === r.id && (
                                            <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving || !selectedItem || !quantity}
                                className="w-full py-6 bg-gradient-to-r from-red-500 to-orange-600 disabled:from-white/5 disabled:to-white/5 disabled:text-white/10 text-white font-black rounded-[2.5rem] shadow-2xl shadow-red-500/30 flex items-center justify-center gap-4 transition-all active:scale-[0.98] uppercase tracking-[0.4em] text-xs border border-white/10 group overflow-hidden"
                            >
                                {isSaving ? (
                                    <span className="material-symbols-outlined animate-spin text-2xl font-black">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined text-2xl font-black group-hover:translate-x-1 transition-transform">delete_sweep</span>
                                )}
                                {isSaving ? 'Memproses...' : 'Catat Waste'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

