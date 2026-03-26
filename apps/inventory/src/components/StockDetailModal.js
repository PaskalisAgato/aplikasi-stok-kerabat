import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react'; // Final deploy trigger
import { apiClient } from '@shared/apiClient';
import { getOptimizedImageUrl } from '@shared/supabase';
const StockDetailModal = ({ isOpen, onClose, selectedItem, onEditClick, onUpdateStockClick }) => {
    const [movements, setMovements] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    React.useEffect(() => {
        if (isOpen && selectedItem?.id) {
            fetchHistory();
        }
    }, [isOpen, selectedItem]);
    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.getItemMovements(selectedItem.id);
            setMovements(data.data);
        }
        catch (err) {
            console.error('Failed to fetch movements', err);
        }
        finally {
            setIsLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return (
    /* Full-screen overlay */
    _jsx("div", { className: "fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "w-full bg-background-app  rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-border-dim", children: [_jsx("button", { onClick: onClose, className: "flex h-6 w-full items-center justify-center cursor-pointer hover:bg-black/5 rounded-t-xl transition-colors", children: _jsx("div", { className: "h-1.5 w-12 rounded-full bg-border-dim" }) }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsx("div", { className: "flex p-4", children: _jsx("div", { className: "flex w-full flex-col gap-4 sm:flex-row sm:justify-between items-start", children: _jsxs("div", { className: "flex gap-4 items-center", children: [_jsx("div", { className: "size-24 rounded-xl overflow-hidden border border-border-dim bg-primary/10 flex-shrink-0", children: _jsx("img", { src: getOptimizedImageUrl(selectedItem?.imageUrl, { width: 300, height: 300 }), alt: selectedItem?.name, loading: "lazy", className: "size-full object-cover", onError: (e) => {
                                                    e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                                                } }) }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-main text-2xl font-bold leading-tight", children: selectedItem?.name || 'Item Name' }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: `inline-block w-2 h-2 rounded-full ${selectedItem?.status === 'KRITIS' ? 'bg-red-500' : selectedItem?.status === 'HABIS' ? 'bg-slate-500' : 'bg-primary'}` }), _jsxs("p", { className: "text-primary font-semibold text-lg", children: [selectedItem?.currentStock || 0, selectedItem?.unit || 'kg', " tersisa"] })] }), _jsxs("p", { className: "text-muted text-sm", children: ["Update terakhir: ", new Date(selectedItem?.updatedAt || Date.now()).toLocaleDateString('id-ID')] })] })] }) }) }), _jsxs("div", { className: "px-4 py-4 mt-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-main text-lg font-bold tracking-tight", children: "Riwayat Stok" }), _jsx("button", { onClick: fetchHistory, className: "text-primary text-sm font-medium hover:underline", children: "Refresh" })] }), _jsx("div", { className: "space-y-4 pb-20", children: isLoading ? (_jsx("div", { className: "flex justify-center py-10", children: _jsx("span", { className: "material-symbols-outlined animate-spin text-primary", children: "sync" }) })) : movements.length > 0 ? (movements.map((m) => (_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.type === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'}`, children: _jsx("span", { className: `material-symbols-outlined text-lg ${m.type === 'IN' ? 'text-green-500' : 'text-red-500'}`, children: m.type === 'IN' ? 'add' : 'remove' }) }), _jsxs("div", { className: "flex-1 border-b border-border-dim pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("p", { className: "text-main font-medium", children: m.reason?.includes('Manual Adjustment') ? 'Penyesuaian Stok' :
                                                                    m.type === 'IN' ? `Restok: ${m.supplierName || 'General'}` :
                                                                        m.type === 'OUT' ? 'Penjualan' :
                                                                            m.type === 'WASTE' ? 'Waste/Rusak' : 'Penyesuaian' }), _jsxs("p", { className: `font-bold ${m.type === 'IN' ? 'text-green-500' : 'text-red-500'}`, children: [m.type === 'IN' ? '+' : '-', m.quantity, " ", selectedItem?.unit] })] }), _jsxs("p", { className: "text-muted text-xs mt-0.5", children: [new Date(m.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), " \u2022 ", new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })] }), m.reason && _jsx("p", { className: "text-[10px] italic text-muted mt-1", children: m.reason })] })] }, m.id)))) : (_jsx("div", { className: "text-center py-10 text-slate-400 text-sm", children: "Belum ada pergerakan stok tercatat." })) })] })] }), _jsxs("div", { className: "p-4 flex gap-3 sticky bottom-0 bg-background-app border-t border-border-dim", children: [_jsxs("button", { onClick: onUpdateStockClick, className: "flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform", children: [_jsx("span", { className: "material-symbols-outlined", children: "inventory" }), "Update Stock"] }), _jsx("button", { onClick: onEditClick, className: "flex size-11 items-center justify-center bg-surface text-main rounded-xl border border-border-dim hover:bg-primary/5 active:scale-95 transition-all", title: "Ubah Data Stok", children: _jsx("span", { className: "material-symbols-outlined", children: "edit" }) }), _jsx("button", { onClick: onEditClick, className: "flex size-11 items-center justify-center bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white active:scale-95 transition-all", title: "Hapus Bahan", children: _jsx("span", { className: "material-symbols-outlined", children: "delete" }) })] }), _jsx("div", { className: "h-6 bg-background-app" })] }) }));
};
export default StockDetailModal;
