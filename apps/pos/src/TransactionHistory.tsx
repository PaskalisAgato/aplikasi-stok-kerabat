import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import type { ApiResponse } from '@shared/apiClient';
import { useSession } from '@shared/authClient';
import { syncEngine } from '@shared/services/SyncEngine';
import { useNotification } from '@shared/components/NotificationProvider';

export default function TransactionHistory({ onBack }: { onBack: () => void }) {
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'Karyawan';
    const isAdmin = userRole === 'Admin';
    const { showNotification } = useNotification();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [_meta, setMeta] = useState<{ page: number; limit: number; total: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [viewData, setViewData] = useState<any>(null); // Details modal
    const [editData, setEditData] = useState<any>(null); // Edit modal

    const [recipesList, setRecipesList] = useState<any[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [voidConfirmId, setVoidConfirmId] = useState<number | null>(null);
    const [voidReason, setVoidReason] = useState("");
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const [expandedDates, setExpandedDates] = useState<string[]>([]);

    const groupedTransactions = transactions.reduce((acc, tx) => {
        const date = new Date(tx.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(tx);
        return acc;
    }, {} as Record<string, any[]>);

    useEffect(() => {
        if (transactions.length > 0) {
            const today = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });
            // By default expand dates that have transactions
            setExpandedDates(prev => {
                if (prev.length > 0) return prev;
                return [today];
            });
        }
    }, [transactions]);

    const toggleDate = (date: string) => {
        setExpandedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [txRes, recRes]: [ApiResponse<any>, ApiResponse<any>] = await Promise.all([
                apiClient.getTransactions(),
                apiClient.getRecipes()
            ]);
            
            setTransactions(txRes.data);
            if (txRes.meta.page !== undefined) {
                setMeta({ page: txRes.meta.page, limit: txRes.meta.limit, total: txRes.meta.total });
            }
            setRecipesList(recRes.data);
        } catch (error) {
            console.error('Failed to load transaction history', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const tx = transactions.find(t => t.id === id);
        const pin = prompt('Masukkan PIN Admin/Supervisor untuk menghapus:');
        if (!pin) return;

        try {
            // Pass point context + adminPin for reversal recovery and server auth
            await syncEngine.enqueue('DELETE_TRANSACTION', { 
                id,
                memberId: tx?.memberId,
                pointsUsed: tx?.pointsUsed,
                pointsEarned: tx?.pointsEarned,
                adminPin: pin 
            });

            showNotification('Permintaan penghapusan dimasukkan ke antrean. Gunakan PIN Admin yang valid (Aga/Yola).', "info");
            setDeleteConfirmId(null);
            setTransactions(prev => prev.filter(tx => tx.id !== id));
        } catch (error: any) {
            showNotification(`Gagal menghapus: ${error.message}`, "error");
        }
    };

    const handleVoid = async (id: number) => {
        if (!voidReason.trim()) {
            showNotification('Alasan pembatalan harus diisi.', "warning");
            return;
        }

        const pin = prompt('Masukkan PIN Admin/Supervisor untuk VOID:');
        if (!pin) return;
        
        const tx = transactions.find(t => t.id === id);
        try {
            // FIXED IDEMPOTENCY KEY: void-{id} ensures backend never double-processes even if clicked 2x
            await syncEngine.enqueue('VOID', { 
                id, 
                reason: voidReason,
                memberId: tx?.memberId,
                pointsUsed: tx?.pointsUsed,
                pointsEarned: tx?.pointsEarned,
                adminPin: pin 
            }, `void-${id}`);

            showNotification('VOID dimasukkan ke antrean. Gunakan PIN Admin yang valid (Aga/Yola).', "success");
            setVoidConfirmId(null);
            setVoidReason("");
            loadData();
        } catch (error: any) {
            showNotification(`Gagal membatalkan: ${error.message}`, "error");
        }
    };

    const handleClearHistory = async () => {
        const pin = prompt('KONFIRMASI KRUSIAL: Masukkan PIN Supervisor untuk MENGHAPUS SEMUA riwayat:');
        if (pin !== '1234') {
            showNotification('PIN Salah! Akses ditolak.', 'error');
            return;
        }

        try {
            await apiClient.clearTransactions();
            showNotification('Seluruh riwayat transaksi berhasil dihapus.', "success");
            setShowClearConfirm(false);
            loadData();
        } catch (error: any) {
            showNotification(`Gagal menghapus riwayat: ${error.message}`, "error");
        }
    };

    const openEdit = (tx: any) => {
        // Deep copy items for editing
        setEditData({
            ...tx,
            items: tx.items.map((i: any) => ({ ...i, isNew: false }))
        });
    };

    const handleEditItemQty = (index: number, delta: number) => {
        setEditData((prev: any) => {
            const newItems = [...prev.items];
            newItems[index].quantity = Math.max(0, newItems[index].quantity + delta);
            return { ...prev, items: newItems };
        });
    };

    const handleRemoveEditItem = (index: number) => {
        setEditData((prev: any) => {
            const newItems = prev.items.filter((_: any, i: number) => i !== index);
            return { ...prev, items: newItems };
        });
    };

    const handleAddEditItem = (recipeId: number) => {
        const recipe = recipesList.find(r => r.id === recipeId);
        if (!recipe) return;

        setEditData((prev: any) => {
            // Check if already in list
            const existingIdx = prev.items.findIndex((i: any) => i.recipeId === recipeId);
            if (existingIdx >= 0) {
                const newItems = [...prev.items];
                newItems[existingIdx].quantity += 1;
                return { ...prev, items: newItems };
            }

            return {
                ...prev,
                items: [...prev.items, {
                    recipeId: recipe.id,
                    recipeName: recipe.name,
                    recipePrice: recipe.price, // map to recipePrice from old DB schema
                    price: recipe.price, // map for checkout payload
                    quantity: 1,
                    subtotal: recipe.price
                }]
            };
        });
    };

    const submitEdit = async () => {
        if (!editData) return;
        
        // Filter out items with 0 qty
        const finalItems = editData.items.filter((i: any) => i.quantity > 0).map((i: any) => ({
            recipeId: i.recipeId,
            quantity: i.quantity,
            price: i.recipePrice || i.price || 0, // Fallback fields
            subtotal: (i.recipePrice || i.price || 0) * i.quantity
        }));

        if (finalItems.length === 0) {
            showNotification('Transaksi tidak dapat disimpan tanpa item.', "warning");
            return;
        }

        const calculatedSubTotal = finalItems.reduce((acc: number, item: any) => acc + item.subtotal, 0);

        try {
            await apiClient.updateTransaction(editData.id, {
                items: finalItems,
                subTotal: calculatedSubTotal,
                totalAmount: calculatedSubTotal, // Simplified, modify if tax involved
                paymentMethod: editData.paymentMethod
            });
            showNotification('Transaksi berhasil diperbarui.', "success");
            setEditData(null);
            loadData();
        } catch (error: any) {
            showNotification(`Gagal memperbarui transaksi: ${error.message}`, "error");
        }
    };

    const TableActions = ({ tx, compact = false }: { tx: any, compact?: boolean }) => {
        if (deleteConfirmId === tx.id) {
            return (
                <div className="flex gap-1 animate-in slide-in-from-right-2 duration-300">
                    <button 
                        onClick={() => handleDelete(tx.id)}
                        className={`${compact ? 'h-9 px-4' : 'h-8 px-3'} rounded-lg bg-red-500 text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                    >
                        Hapus
                    </button>
                    <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className={`${compact ? 'h-9 px-4' : 'h-8 px-3'} rounded-lg glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all`}
                    >
                        Batal
                    </button>
                </div>
            );
        }

        return (
            <div className="flex gap-2">
                <button 
                    onClick={() => setViewData(tx)}
                    className={`${compact ? 'size-10' : 'size-8'} rounded-lg glass text-blue-500 hover:bg-blue-500 hover:text-[var(--text-main)] transition-all flex items-center justify-center shrink-0`}
                    title="Lihat Detail"
                >
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                </button>
                
                <button 
                    onClick={() => setDeleteConfirmId(tx.id)}
                    className={`${compact ? 'size-10' : 'size-8'} rounded-lg glass text-red-500 hover:bg-red-500 hover:text-[var(--text-main)] transition-all flex items-center justify-center shrink-0`}
                    title="Hapus Transaksi"
                >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
                
                <button 
                    onClick={() => setVoidConfirmId(tx.id)}
                    className={`${compact ? 'size-10' : 'size-8'} rounded-lg glass transition-all flex items-center justify-center shrink-0 ${tx.isVoided ? 'text-gray-400 cursor-not-allowed opacity-50' : 'text-purple-500 hover:bg-purple-500 hover:text-[var(--text-main)]'}`}
                    title={tx.isVoided ? "Sudah dibatalkan" : "Void/Batalkan Transaksi"}
                    disabled={tx.isVoided}
                >
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                </button>

                {isAdmin && (
                    <button 
                        onClick={() => openEdit(tx)}
                        className={`${compact ? 'size-10' : 'size-8'} rounded-lg glass text-orange-500 hover:bg-orange-500 hover:text-[var(--text-main)] transition-all flex items-center justify-center shrink-0`}
                        title="Edit Transaksi"
                    >
                        <span className="material-symbols-outlined text-[20px]">edit_square</span>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="p-2 md:p-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 px-2 gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 md:size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl md:text-2xl font-black">history</span>
                    </div>
                    <h2 className="font-black text-lg md:text-xl uppercase tracking-widest text-[var(--text-main)] truncate">Riwayat Transaksi</h2>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto">
                    {isAdmin && transactions.length > 0 && (
                        <div className="flex-1 md:flex-none">
                            {!showClearConfirm ? (
                                <button 
                                    onClick={() => setShowClearConfirm(true)}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-sm font-black">delete_sweep</span>
                                    Hapus <span className="hidden xs:inline">Semua</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 animate-in zoom-in duration-300 w-full">
                                    <button 
                                        onClick={() => setShowClearConfirm(false)}
                                        className="flex-1 px-2 md:px-4 py-2.5 md:py-3 rounded-xl hover:bg-[var(--border-dim)] text-[var(--text-muted)] transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleClearHistory}
                                        className="flex-[2] flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2.5 md:py-3 rounded-xl bg-red-600 text-[var(--text-main)] shadow-lg shadow-red-600/20 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95 animate-pulse"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">check</span>
                                        Ya, Hapus
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <button 
                        onClick={onBack}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl glass hover:bg-primary/20 text-primary transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest active:scale-95 shadow-lg border border-[var(--border-dim)]"
                    >
                        <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_back</span>
                        Kembali
                    </button>
                </div>
            </div>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header Stats */}
                <div className="flex justify-between items-center px-2">
                    <h2 className="font-black text-xl uppercase tracking-widest text-[var(--text-main)]">Daftar Transaksi</h2>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)]">Total Record</p>
                        <p className="text-2xl font-black text-primary">{transactions.length}</p>
                    </div>
                </div>

                {/* Grouped List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="card p-20 text-center text-[var(--text-muted)] animate-pulse shadow-xl">Memuat jejak transaksi...</div>
                    ) : transactions.length === 0 ? (
                        <div className="card p-20 text-center text-[var(--text-muted)] shadow-xl">Belum ada transaksi tercatat.</div>
                    ) : (Object.entries(groupedTransactions) as [string, any[]][]).map(([date, txs]) => {
                        const isExpanded = expandedDates.includes(date);
                        const dayTotal = txs.reduce((sum: number, tx: any) => sum + parseFloat(tx.totalAmount), 0);

                        return (
                            <div key={date} className="space-y-3">
                                <button 
                                    onClick={() => toggleDate(date)}
                                    className={`w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all ${isExpanded ? 'bg-primary/10 border-primary/30 shadow-lg accent-glow' : 'glass border-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-slate-950' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                                            <span className="material-symbols-outlined text-xl">{isExpanded ? 'calendar_month' : 'event'}</span>
                                        </div>
                                        <div className="text-left">
                                            <h3 className={`font-black uppercase tracking-widest text-sm ${isExpanded ? 'text-primary' : 'text-[var(--text-main)]'}`}>{date}</h3>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{txs.length} TRANSAKSI</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden xs:block">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Total Harian</p>
                                            <p className="font-black text-[var(--text-main)]">Rp {dayTotal.toLocaleString('id-ID')}</p>
                                        </div>
                                        <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-[var(--text-muted)]'}`}>
                                            expand_more
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="space-y-3">
                                        {/* Desktop Table View */}
                                        <div className="card hidden lg:block overflow-x-auto shadow-2xl p-0">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="glass uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-b border-[var(--border-dim)]">
                                                        <th className="p-5 font-black">ID</th>
                                                        <th className="p-5 font-black">Jam</th>
                                                        <th className="p-5 font-black">Kasir</th>
                                                        <th className="p-5 font-black text-right">Total</th>
                                                        <th className="p-5 font-black">Metode</th>
                                                        <th className="p-5 font-black text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border-dim)]">
                                                    {txs.map((tx: any) => (
                                                        <tr key={tx.id} className="hover:bg-[var(--bg-app)]/50 transition-colors">
                                                            <td className="p-5 font-black text-[var(--text-main)]">#{tx.id}</td>
                                                            <td className="p-5 text-sm text-[var(--text-muted)] font-medium">
                                                                {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="p-5 text-sm font-bold text-primary">{tx.cashierName || tx.userId}</td>
                                                            <td className="p-5 font-black text-[var(--text-main)] text-right">Rp {parseFloat(tx.totalAmount).toLocaleString('id-ID')}</td>
                                                            <td className="p-5">
                                                                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary/10 text-primary">
                                                                    {tx.paymentMethod}
                                                                </span>
                                                            </td>
                                                            <td className="p-5 flex justify-end gap-2">
                                                                <TableActions tx={tx} />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card-Based View */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
                                            {txs.map((tx: any) => (
                                                <div key={tx.id} className="card p-0 overflow-hidden border-white/5 shadow-xl hover:border-white/10 transition-all">
                                                    <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-primary text-base font-black">receipt</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-xs text-[var(--text-main)] uppercase tracking-widest">#{tx.id}</p>
                                                                <p className="text-[10px] text-[var(--text-muted)] font-bold">
                                                                    {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary">
                                                            {tx.paymentMethod}
                                                        </span>
                                                    </div>
                                                    <div className="p-4 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Total Transaksi</p>
                                                            <p className="text-xl font-black text-[var(--text-main)]">Rp {parseFloat(tx.totalAmount).toLocaleString('id-ID')}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Kasir</p>
                                                            <p className="text-xs font-bold text-primary truncate max-w-[100px]">{tx.cashierName || tx.userId}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white/[0.02] border-t border-white/5 flex flex-wrap gap-2 justify-end">
                                                        <TableActions tx={tx} compact />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* DETAIL MODAL */}
            {viewData && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="card max-w-lg w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-white/10">
                        <header className="glass p-6 flex justify-between items-center border-b border-white/5">
                            <div>
                                <h3 className="font-black text-xl text-[var(--text-main)] uppercase tracking-widest">Detail Transaksi #{viewData.id}</h3>
                                <p className="text-xs text-primary font-bold mt-1">{new Date(viewData.createdAt).toLocaleString('id-ID')}</p>
                            </div>
                            <button onClick={() => setViewData(null)} className="size-10 rounded-xl glass hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                            {viewData.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center glass p-4 rounded-2xl">
                                    <div>
                                        <p className="font-black text-[var(--text-main)] uppercase">{item.recipeName}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{item.quantity} x Rp {item.recipePrice ? parseFloat(item.recipePrice).toLocaleString('id-ID') : '0'}</p>
                                    </div>
                                    <p className="font-black text-primary">Rp {parseFloat(item.subtotal).toLocaleString('id-ID')}</p>
                                </div>
                            ))}
                        </div>
                        <footer className="glass p-6 border-t border-white/5 flex justify-between items-center shrink-0">
                            <span className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">Total Bayar</span>
                            <span className="text-2xl font-black text-primary">Rp {parseFloat(viewData.totalAmount).toLocaleString('id-ID')}</span>
                        </footer>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editData && (
                <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in duration-300">
                    <div className="card max-w-2xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.15)] border border-primary/20">
                        <header className="accent-gradient p-6 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-black text-2xl text-[var(--text-main)] uppercase tracking-widest">Edit Transaksi #{editData.id}</h3>
                                <p className="text-xs text-[var(--text-main)]/70 font-bold mt-1 uppercase tracking-widest">Perubahan diaudit dalam log</p>
                            </div>
                            <button onClick={() => setEditData(null)} className="size-10 rounded-xl bg-slate-950/20 text-[var(--text-main)] hover:bg-slate-950/30 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar bg-[var(--bg-app)]">
                            {/* Items List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-dim)] pb-2">Item Terjual</h4>
                                {editData.items?.length === 0 && (
                                    <p className="text-sm text-center py-4 text-red-400 font-bold border border-red-500/20 rounded-xl bg-red-500/5">Item kosong. Transaksi akan ditolak jika disimpan.</p>
                                )}
                                {editData.items?.map((item: any, idx: number) => {
                                    const rawPrice = item.recipePrice || item.price || 0;
                                    const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;

                                    return (
                                        <div key={idx} className="flex items-center gap-4 glass p-3 rounded-2xl relative group">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-[var(--text-main)] text-auto-fit uppercase">{item.recipeName}</p>
                                                <p className="text-xs text-primary font-bold">Rp {price.toLocaleString('id-ID')}</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-[var(--bg-app)] p-1.5 rounded-xl shrink-0 border border-white/5">
                                                <button onClick={() => handleEditItemQty(idx, -1)} className="size-8 rounded-lg bg-[var(--bg-app)] hover:bg-red-500/20 hover:text-red-500 transition-all font-black text-lg flex items-center justify-center">-</button>
                                                <span className="w-6 text-center font-black text-lg">{item.quantity}</span>
                                                <button onClick={() => handleEditItemQty(idx, 1)} className="size-8 rounded-lg glass text-primary hover:bg-primary hover:text-slate-950 transition-all font-black text-lg flex items-center justify-center">+</button>
                                            </div>
                                            <button onClick={() => handleRemoveEditItem(idx)} className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100">
                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Add More Items Dropdown */}
                            <div className="space-y-2 pt-4">
                                <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Tambah Item Baru</h4>
                                <select 
                                    className="w-full h-12 px-4 rounded-xl glass focus:ring-2 focus:ring-primary border border-white/10 text-sm font-bold appearance-none bg-[var(--bg-app)] cursor-pointer"
                                    onChange={(e) => {
                                        if(e.target.value) {
                                            handleAddEditItem(parseInt(e.target.value));
                                            e.target.value = ""; // reset
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Pilih Menu --</option>
                                    {recipesList.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} - Rp {r.price.toLocaleString('id-ID')}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Method */}
                            <div className="pt-4 border-t border-[var(--border-dim)]">
                                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Metode Pembayaran</h4>
                                <div className="flex gap-3">
                                    {['CASH', 'QRIS', 'CARD'].map(method => (
                                        <button 
                                            key={method}
                                            onClick={() => setEditData({...editData, paymentMethod: method})}
                                            className={`flex-1 py-1.5 rounded-lg font-black tracking-widest text-[10px] uppercase border-2 transition-all ${editData.paymentMethod === method ? 'border-primary text-primary bg-primary/10' : 'border-transparent glass text-[var(--text-muted)] hover:border-white/10'}`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <footer className="glass p-6 border-t border-white/10 flex justify-between items-center shrink-0">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-black text-primary">Subtotal Baru</p>
                                <p className="text-2xl font-black text-[var(--text-main)]">
                                    Rp {editData.items.reduce((acc: number, item: any) => acc + ((item.recipePrice || item.price || 0) * item.quantity), 0).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <button onClick={submitEdit} className="btn-primary py-3 px-8 rounded-xl font-black tracking-widest uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                Simpan Perubahan
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* VOID MODAL */}
            {voidConfirmId && (
                <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <div className="card max-w-md w-full p-0 overflow-hidden shadow-2xl border border-purple-500/20">
                        <header className="bg-purple-600 p-6 flex justify-between items-center text-[var(--text-main)]">
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-widest">Batalkan Transaksi</h3>
                                <p className="text-xs font-bold mt-1 opacity-80 uppercase tracking-widest">Audit LOG: VOID #{voidConfirmId}</p>
                            </div>
                            <button onClick={() => setVoidConfirmId(null)} className="size-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        <div className="p-6 space-y-4 bg-[var(--bg-app)]">
                            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">Masukkan Alasan Pembatalan:</p>
                            <textarea 
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder="Contoh: Kesalahan input menu, customer batal, dll..."
                                className="w-full h-32 p-4 rounded-2xl glass border border-white/10 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium resize-none"
                                autoFocus
                            />
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setVoidConfirmId(null)}
                                    className="flex-1 py-3 px-4 rounded-xl glass font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={() => handleVoid(voidConfirmId)}
                                    className="flex-1 py-3 px-4 rounded-xl bg-purple-600 text-[var(--text-main)] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                                >
                                    Konfirmasi VOID
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
