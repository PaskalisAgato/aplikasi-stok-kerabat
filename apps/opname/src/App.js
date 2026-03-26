import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
function App() {
    const [inventoryList, setInventoryList] = useState([]);
    const [physicalStocks, setPhysicalStocks] = useState({});
    const [reasons, setReasons] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const controllerRef = useRef(null);
    const fetchInventory = async (isLoadMore = false) => {
        try {
            setIsLoading(true);
            const currentPage = isLoadMore ? page + 1 : 1;
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            const response = await apiClient.getInventory(20, (currentPage - 1) * 20, searchTerm, '', '', controller.signal);
            if (isLoadMore) {
                setInventoryList(prev => [...prev, ...response.data]);
                setPage(currentPage);
            }
            else {
                setInventoryList(response.data);
                setPage(1);
            }
            setHasMore(response.data.length === 20);
            // Update physical stocks with current stock values for new items
            setPhysicalStocks(prev => {
                const newStocks = { ...prev };
                response.data.forEach((item) => {
                    if (!(item.id in newStocks)) {
                        newStocks[item.id] = (item.currentStock ?? 0).toString();
                    }
                });
                return newStocks;
            });
        }
        catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Failed to load inventory', error);
                alert('Gagal memuat data inventaris.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchInventory();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);
    const handleStockChange = (id, value) => {
        setPhysicalStocks(prev => ({ ...prev, [id]: value }));
    };
    const handleReasonChange = (id, value) => {
        setReasons(prev => ({ ...prev, [id]: value }));
    };
    const handleSaveOpname = async () => {
        setIsSaving(true);
        try {
            const adjustments = inventoryList.map(item => ({
                inventoryId: item.id,
                physicalStock: physicalStocks[item.id] || (item.currentStock ?? 0).toString(),
                reason: reasons[item.id] || 'Manual Opname'
            })).filter(adj => {
                const item = inventoryList.find(i => i.id === adj.inventoryId);
                return item && adj.physicalStock !== (item.currentStock ?? 0).toString();
            });
            if (adjustments.length === 0) {
                alert('Tidak ada perubahan stok yang dideteksi.');
                return;
            }
            await apiClient.submitOpname(adjustments);
            alert('Hasil opname berhasil disimpan!');
            await fetchInventory(); // Refresh data
        }
        catch (error) {
            console.error('Failed to save opname', error);
            alert('Gagal menyimpan hasil opname.');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsx(Layout, { currentPort: 5177, title: "Stock Opname", subtitle: "Inventory Audit Portal", footer: _jsx("footer", { className: "p-8 glass border-t border-white/10 z-50 shrink-0 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]", children: _jsxs("button", { onClick: handleSaveOpname, disabled: isSaving || isLoading, className: "w-full bg-primary text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 active:scale-[0.95] hover:scale-[1.02] transition-all disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none font-display", children: [isSaving ? (_jsx("span", { className: "material-symbols-outlined animate-spin font-black", children: "autorenew" })) : (_jsx("span", { className: "material-symbols-outlined font-black", children: "verified_user" })), isSaving ? 'MEMPROSES AUDIT...' : 'FINALISASI STOK OPNAME'] }) }), children: _jsxs("div", { className: "space-y-10", children: [_jsx("section", { className: "animate-in fade-in slide-in-from-top-4 duration-700", children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none", children: _jsx("span", { className: "material-symbols-outlined text-primary/40 group-focus-within:text-primary transition-colors font-black", children: "search" }) }), _jsx("input", { className: "block w-full pl-14 pr-6 py-5 glass border-white/10 rounded-3xl focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm font-black uppercase tracking-widest outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-40", placeholder: "Cari Bahan Baku...", type: "text", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }) }), _jsxs("div", { className: "flex items-center justify-between px-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("h3", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60", children: "Inventory List" }), _jsx("p", { className: "text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase", children: "Katalog Bahan" })] }), _jsxs("span", { className: "px-5 py-2 glass rounded-full text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20 shadow-inner", children: [inventoryList.length, " Items Sync"] })] }), _jsxs("div", { className: "space-y-6 pb-20", children: [isLoading ? (_jsxs("div", { className: "flex flex-col justify-center items-center py-20 gap-6 glass rounded-[3rem] opacity-60", children: [_jsx("div", { className: "size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" }), _jsx("p", { className: "text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse", children: "Menghubungkan ke Cold Storage..." })] })) : inventoryList.map((item, idx) => {
                            const physical = parseFloat(physicalStocks[item.id] || (item.currentStock ?? 0).toString());
                            const system = parseFloat((item.currentStock ?? 0).toString());
                            const diff = physical - system;
                            return (_jsxs("div", { className: "card group p-6 border-white/5 hover:scale-[1.01] active:scale-[0.99] transition-all relative overflow-hidden", style: { animationDelay: `${idx * 50}ms` }, children: [_jsxs("div", { className: "flex gap-6 items-start mb-8 relative z-10", children: [_jsx("div", { className: "size-20 rounded-2xl shrink-0 border-2 border-white/10 shadow-2xl bg-cover bg-center bg-[var(--bg-app)] group-hover:rotate-3 transition-transform duration-500", style: { backgroundImage: item.imageUrl ? `url('${item.imageUrl}')` : 'none' }, children: !item.imageUrl && (_jsx("div", { className: "flex items-center justify-center h-full text-white/10 bg-white/5", children: _jsx("span", { className: "material-symbols-outlined text-3xl font-black", children: "image" }) })) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [_jsx("h4", { className: "text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-none truncate group-hover:text-primary transition-colors", children: item.name }), _jsxs("p", { className: "text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60", children: ["Satuan: ", item.unit] }), _jsx("div", { className: "flex items-center gap-3 mt-4", children: _jsxs("div", { className: "px-3 py-1.5 glass rounded-lg border-white/5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2", children: [_jsx("span", { className: "material-symbols-outlined text-[14px]", children: "terminal" }), "System: ", item.currentStock] }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-6 mb-6 relative z-10", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2", children: "Stok Fisik" }), _jsx("input", { className: "w-full glass border-white/10 rounded-2xl text-center font-black text-2xl py-4 focus:ring-4 focus:ring-primary/20 focus:border-primary/40 focus:bg-primary/5 transition-all outline-none", type: "number", inputMode: "decimal", value: physicalStocks[item.id] ?? '', onChange: (e) => handleStockChange(item.id, e.target.value), placeholder: "0" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2", children: "Varian (Diff)" }), _jsx("div", { className: `w-full rounded-2xl text-center font-black text-2xl py-4 border-2 flex items-center justify-center gap-2 shadow-2xl transition-colors duration-500 ${diff < 0 ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10' :
                                                            diff > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10' :
                                                                'glass border-white/10 text-[var(--text-muted)] opacity-40'}`, children: diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2) })] })] }), _jsxs("div", { className: "space-y-3 border-t border-white/5 pt-6 relative z-10", children: [_jsx("label", { className: "text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 ml-2", children: "Memo Penyesuaian" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { className: "w-full glass border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest py-4 pl-6 pr-12 focus:ring-4 focus:ring-primary/20 appearance-none outline-none transition-all cursor-pointer", value: reasons[item.id] || '', onChange: (e) => handleReasonChange(item.id, e.target.value), children: [_jsx("option", { value: "", className: "bg-[var(--bg-app)]", children: "Pilih Alasan Audit" }), _jsx("option", { value: "Spillage", className: "bg-[var(--bg-app)]", children: "Kerusakan / Tumpah" }), _jsx("option", { value: "Counting Error", className: "bg-[var(--bg-app)]", children: "Kesalahan Hitung" }), _jsx("option", { value: "Theft/Missing", className: "bg-[var(--bg-app)]", children: "Kehilangan / Shrinkage" }), _jsx("option", { value: "Expired", className: "bg-[var(--bg-app)]", children: "Kadaluwarsa / Bad Stock" })] }), _jsx("span", { className: "material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black pointer-events-none", children: "expand_more" })] })] }), _jsx("div", { className: "absolute -right-8 -top-8 size-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" })] }, item.id));
                        }), hasMore && !isLoading && (_jsx("button", { onClick: () => fetchInventory(true), className: "w-full py-6 glass border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] text-primary hover:bg-primary/5 transition-all", children: "Muat Lebih Banyak..." }))] })] }) }));
}
export default App;
