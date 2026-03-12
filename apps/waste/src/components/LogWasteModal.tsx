import { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (isOpen) {
            apiClient.getInventory().then(setInventoryList).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredInventory = inventoryList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <div className="w-full bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">
                {/* Drag Handle */}
                <div className="flex h-6 w-full items-center justify-center flex-shrink-0">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30" />
                </div>

                <div className="flex-1 overflow-y-auto px-5 pb-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Catat Waste</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Log barang rusak atau terbuang</p>
                        </div>
                        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Step 1: Select Item */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">1. Pilih Bahan Baku</label>
                            <div className="relative mb-2">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Cari bahan..."
                                    className="w-full pl-10 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 dark:border-primary/10 p-1 bg-slate-50 dark:bg-primary/5">
                                {filteredInventory.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all text-sm ${selectedItem?.id === item.id
                                            ? 'bg-primary text-white'
                                            : 'hover:bg-primary/10 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        <span className="font-bold">{item.name}</span>
                                        <span className={`text-xs font-medium ${selectedItem?.id === item.id ? 'text-white/70' : 'text-slate-400'}`}>
                                            Stok: {item.currentStock} {item.unit}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {selectedItem && (
                                <p className="text-xs text-primary font-bold mt-1.5 px-1">✓ Dipilih: {selectedItem.name}</p>
                            )}
                        </div>

                        {/* Step 2: Quantity */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                                2. Jumlah yang Dibuang {selectedItem && `(${selectedItem.unit})`}
                            </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                placeholder="Contoh: 0.5"
                                min="0.01"
                                step="0.01"
                                className="w-full py-3 px-4 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none text-lg font-bold text-center"
                            />
                        </div>

                        {/* Step 3: Reason */}
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">3. Alasan</label>
                            <div className="grid grid-cols-2 gap-2">
                                {WASTE_REASONS.map(r => (
                                    <button
                                        key={r.id}
                                        onClick={() => setReason(r.id)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${reason === r.id
                                            ? 'bg-red-500 border-red-500 text-white'
                                            : 'bg-primary/5 border-primary/20 text-slate-600 dark:text-slate-300 hover:border-red-400/50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                                        <span className="text-xs font-bold leading-tight">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined">delete_sweep</span>
                            )}
                            {isSaving ? 'Menyimpan...' : 'Catat Waste Sekarang'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
