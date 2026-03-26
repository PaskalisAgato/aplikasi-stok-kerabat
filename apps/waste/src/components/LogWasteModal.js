import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
const WASTE_REASONS = [
    { id: 'Expired', label: 'Kadaluwarsa / Basi', icon: 'timer_off' },
    { id: 'Spillage', label: 'Tumpah / Rusak', icon: 'water_drop' },
    { id: 'Burnt', label: 'Salah Masak / Gosong', icon: 'local_fire_department' },
    { id: 'Quality Reject', label: 'Kualitas Buruk', icon: 'thumb_down' },
    { id: 'Other', label: 'Lainnya', icon: 'category' },
];
export default function LogWasteModal({ isOpen, onClose, onSaved }) {
    const [inventoryList, setInventoryList] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('Expired');
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const controllerRef = React.useRef(null);
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
        if (!isOpen)
            return;
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
        }
        catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Failed to load inventory', error);
            }
        }
    };
    if (!isOpen)
        return null;
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
        }
        catch (error) {
            console.error(error);
            alert('Gagal mencatat waste. Coba lagi.');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "w-full bg-background-app  rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20", children: [_jsx("div", { className: "flex h-6 w-full items-center justify-center flex-shrink-0", children: _jsx("div", { className: "h-1.5 w-12 rounded-full bg-primary/30" }) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-5 pb-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-5", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 ", children: "Catat Waste" }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: "Log barang rusak atau terbuang" })] }), _jsx("button", { onClick: onClose, className: "w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 text-primary", children: _jsx("span", { className: "material-symbols-outlined", children: "close" }) })] }), _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2", children: "1. Pilih Bahan Baku" }), _jsxs("div", { className: "relative mb-2", children: [_jsx("span", { className: "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]", children: "search" }), _jsx("input", { type: "text", value: searchTerm, onChange: e => setSearchTerm(e.target.value), placeholder: "Cari bahan...", className: "w-full pl-10 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm font-medium" })] }), _jsx("div", { className: "max-h-40 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200  p-1 bg-slate-50 ", children: filteredInventory.map(item => (_jsxs("button", { onClick: () => setSelectedItem(item), className: `w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all text-sm ${selectedItem?.id === item.id
                                                    ? 'bg-primary text-white'
                                                    : 'hover:bg-primary/10 text-slate-700 '}`, children: [_jsx("span", { className: "font-bold", children: item.name }), _jsxs("span", { className: `text-xs font-medium ${selectedItem?.id === item.id ? 'text-white/70' : 'text-slate-400'}`, children: ["Stok: ", item.currentStock, " ", item.unit] })] }, item.id))) }), selectedItem && (_jsxs("p", { className: "text-xs text-primary font-bold mt-1.5 px-1", children: ["\u2713 Dipilih: ", selectedItem.name] }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2", children: ["2. Jumlah yang Dibuang ", selectedItem && `(${selectedItem.unit})`] }), _jsx("input", { type: "number", value: quantity, onChange: e => setQuantity(e.target.value), placeholder: "Contoh: 0.5", min: "0.01", step: "0.01", className: "w-full py-3 px-4 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary outline-none text-lg font-bold text-center" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2", children: "3. Alasan" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: WASTE_REASONS.map(r => (_jsxs("button", { onClick: () => setReason(r.id), className: `flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${reason === r.id
                                                    ? 'bg-red-500 border-red-500 text-white'
                                                    : 'bg-primary/5 border-primary/20 text-slate-600  hover:border-red-400/50'}`, children: [_jsx("span", { className: "material-symbols-outlined text-[18px]", children: r.icon }), _jsx("span", { className: "text-xs font-bold leading-tight", children: r.label })] }, r.id))) })] }), _jsxs("button", { onClick: handleSubmit, disabled: isSaving, className: "w-full py-4 bg-red-500 hover:bg-red-600 disabled:bg-slate-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]", children: [isSaving ? (_jsx("span", { className: "material-symbols-outlined animate-spin", children: "refresh" })) : (_jsx("span", { className: "material-symbols-outlined", children: "delete_sweep" })), isSaving ? 'Menyimpan...' : 'Catat Waste Sekarang'] })] })] })] }) }));
}
