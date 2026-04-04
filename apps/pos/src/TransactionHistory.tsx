import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import type { ApiResponse } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { useSession } from '@shared/authClient';

export default function TransactionHistory({ onBack }: { onBack: () => void }) {
    const { data: session } = useSession();
    const userRole = session?.user?.role || 'Karyawan';
    const isAdmin = userRole === 'Admin';

    const [transactions, setTransactions] = useState<any[]>([]);
    const [_meta, setMeta] = useState<{ page: number; limit: number; total: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [viewData, setViewData] = useState<any>(null); // Details modal
    const [editData, setEditData] = useState<any>(null); // Edit modal

    // Recipes list for edit modal dropdowns
    const [recipesList, setRecipesList] = useState<any[]>([]);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
        try {
            await apiClient.deleteTransaction(id);
            alert('Transaksi berhasil dihapus.');
            setDeleteConfirmId(null);
            loadData();
        } catch (error: any) {
            alert(`Gagal menghapus: ${error.message}`);
        }
    };

    const handleClearHistory = async () => {
        if (!confirm('PERINGATAN: Anda akan menghapus SELURUH riwayat transaksi. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return;
        try {
            await apiClient.clearTransactions();
            alert('Seluruh riwayat transaksi berhasil dihapus.');
            loadData();
        } catch (error: any) {
            alert(`Gagal menghapus riwayat: ${error.message}`);
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
            alert('Transaksi tidak dapat disimpan tanpa item. Silakan gunakan tombol hapus transaksi jika ingin dibatalkan.');
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
            alert('Transaksi berhasil diperbarui.');
            setEditData(null);
            loadData();
        } catch (error: any) {
            alert(`Gagal memperbarui transaksi: ${error.message}`);
        }
    };

    return (
        <Layout 
            currentPort={5186} 
            title="Jejak Transaksi" 
            subtitle="Audit Trail & Riwayat"
            headerExtras={
                <div className="flex gap-2">
                    {isAdmin && transactions.length > 0 && (
                        <button 
                            onClick={handleClearHistory}
                            className="h-10 px-4 flex items-center gap-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md font-black text-xs uppercase tracking-widest border border-red-500/20"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                            Hapus Semua
                        </button>
                    )}
                    <button 
                        onClick={onBack} 
                        className="h-10 px-4 flex items-center gap-2 rounded-xl glass hover:bg-primary/20 hover:text-primary transition-all shadow-md font-black text-xs uppercase tracking-widest text-[var(--text-main)]"
                    >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                        Kembali
                    </button>
                </div>
            }
        >
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Header Stats */}
                <div className="flex justify-between items-center px-2">
                    <h2 className="font-black text-xl uppercase tracking-widest text-[var(--text-main)]">Daftar Transaksi</h2>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)]">Total Record</p>
                        <p className="text-2xl font-black text-primary">{transactions.length}</p>
                    </div>
                </div>

                {/* Table List */}
                <div className="card overflow-x-auto shadow-2xl p-0">
                    {isLoading ? (
                        <div className="p-20 text-center text-[var(--text-muted)] animate-pulse">Memuat jejak transaksi...</div>
                    ) : transactions.length === 0 ? (
                        <div className="p-20 text-center text-[var(--text-muted)]">Belum ada transaksi tercatat.</div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="glass uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-b border-[var(--border-dim)]">
                                    <th className="p-5 font-black">ID</th>
                                    <th className="p-5 font-black">Waktu</th>
                                    <th className="p-5 font-black">Kasir</th>
                                    <th className="p-5 font-black text-right">Total</th>
                                    <th className="p-5 font-black">Metode</th>
                                    <th className="p-5 font-black text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-dim)]">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-[var(--bg-app)]/50 transition-colors">
                                        <td className="p-5 font-black text-[var(--text-main)]">#{tx.id}</td>
                                        <td className="p-5 text-sm text-[var(--text-muted)] font-medium">
                                            {new Date(tx.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="p-5 text-sm font-bold text-primary">{tx.cashierName || tx.userId}</td>
                                        <td className="p-5 font-black text-[var(--text-main)] text-right">Rp {parseFloat(tx.totalAmount).toLocaleString('id-ID')}</td>
                                        <td className="p-5">
                                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-primary/10 text-primary">
                                                {tx.paymentMethod}
                                            </span>
                                        </td>
                                         <td className="p-5 flex justify-end gap-2">
                                            {deleteConfirmId === tx.id ? (
                                                <div className="flex gap-1 animate-in slide-in-from-right-2 duration-300">
                                                    <button 
                                                        onClick={() => handleDelete(tx.id)}
                                                        className="h-8 px-3 rounded-lg bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                                    >
                                                        Hapus
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeleteConfirmId(null)}
                                                        className="h-8 px-3 rounded-lg glass text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => setViewData(tx)}
                                                        className="size-8 rounded-lg glass text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                                        title="Lihat Detail"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                    
                                                     <button 
                                                        onClick={() => setDeleteConfirmId(tx.id)}
                                                        className="size-8 rounded-lg glass text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                                        title="Hapus Transaksi"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                    
                                                    {isAdmin && (
                                                        <button 
                                                            onClick={() => openEdit(tx)}
                                                            className="size-8 rounded-lg glass text-orange-500 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                                            title="Edit Transaksi"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
                                <h3 className="font-black text-2xl text-slate-950 uppercase tracking-widest">Edit Transaksi #{editData.id}</h3>
                                <p className="text-xs text-slate-900/70 font-bold mt-1 uppercase tracking-widest">Perubahan diaudit dalam log</p>
                            </div>
                            <button onClick={() => setEditData(null)} className="size-10 rounded-xl bg-slate-950/20 text-slate-950 hover:bg-slate-950/30 flex items-center justify-center transition-all">
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
                                            <button onClick={() => handleRemoveEditItem(idx)} className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100">
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
                                <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Metode Pembayaran</h4>
                                <div className="flex gap-4">
                                    {['CASH', 'QRIS', 'CARD'].map(method => (
                                        <button 
                                            key={method}
                                            onClick={() => setEditData({...editData, paymentMethod: method})}
                                            className={`flex-1 py-3 rounded-xl font-black tracking-widest text-xs uppercase border-2 transition-all ${editData.paymentMethod === method ? 'border-primary text-primary bg-primary/10' : 'border-transparent glass text-[var(--text-muted)] hover:border-white/10'}`}
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
        </Layout>
    );
}
